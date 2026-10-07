"""Provider-agnostic wrapper around the language model.

The rest of the assistant only talks to LLMClient.generate().
This version uses Groq's API.
"""

import json
import logging
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# Temporary server errors worth retrying.
RETRY_STATUSES = (500, 502, 503, 504)
RETRY_DELAYS = (1, 3)


class LLMError(Exception):
    """Raised when the model provider fails."""


@dataclass
class ToolCall:
    name: str
    args: dict


@dataclass
class LLMResponse:
    text: str = ''
    tool_calls: list = field(default_factory=list)
    raw: Any = None


class GroqClient:
    """Calls Groq's OpenAI-compatible chat completions API."""

    BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

    def __init__(self, api_key, model='openai/gpt-oss-20b', timeout=30):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    # ── public ────────────────────────────────────────────────────────────────

    def generate(self, system, messages, tools):
        groq_messages = self._to_messages(system, messages)

        body = {
            'model': self.model,
            'messages': groq_messages,
            'temperature': 0.2,
        }

        if tools:
            body['tools'] = [
                {
                    'type': 'function',
                    'function': tool
                }
                for tool in tools
            ]

        data = self._post(body)

        return self._parse(data)

    # ── conversion helpers ────────────────────────────────────────────────────

    @staticmethod
    def _to_messages(system, messages):
        result = [{'role': 'system', 'content': system}]
        pending_ids = []  # ids of tool calls still waiting for their result
        counter = 0

        for m in messages:
            role = m['role']

            if role == 'user':
                result.append({'role': 'user', 'content': m.get('text', '')})

            elif role == 'assistant':
                message = {'role': 'assistant', 'content': m.get('text', '') or None}
                tool_calls = m.get('tool_calls')

                if tool_calls:
                    pending_ids = []
                    message['tool_calls'] = []
                    for call in tool_calls:
                        counter += 1
                        call_id = f'call_{counter}'
                        pending_ids.append(call_id)
                        message['tool_calls'].append({
                            'id': call_id,
                            'type': 'function',
                            'function': {
                                'name': call.name,
                                'arguments': json.dumps(call.args),
                            },
                        })

                result.append(message)

            elif role == 'tool':
                # Results arrive in the same order as the calls were made.
                call_id = pending_ids.pop(0) if pending_ids else f'call_{counter}'
                result.append({
                    'role': 'tool',
                    'tool_call_id': call_id,
                    'content': json.dumps(m.get('result', {})),
                })

        return result

    @staticmethod
    def _parse(data):
        choices = data.get('choices') or []

        if not choices:
            raise LLMError(
                'The AI model returned no answer. Please try again.'
            )

        message = choices[0].get('message') or {}

        text = message.get('content') or ''

        calls = []

        for call in message.get('tool_calls') or []:
            function = call.get('function') or {}

            name = function.get('name')
            arguments = function.get('arguments') or '{}'

            try:
                args = json.loads(arguments)
            except json.JSONDecodeError:
                args = {}

            if name:
                calls.append(
                    ToolCall(
                        name=name,
                        args=args
                    )
                )

        if not text and not calls:
            raise LLMError(
                'The AI model returned an empty answer. Please try again.'
            )

        return LLMResponse(
            text=text,
            tool_calls=calls,
            raw=message
        )

    # ── HTTP ──────────────────────────────────────────────────────────────────

    def _post(self, body):
        request = urllib.request.Request(
            self.BASE_URL,
            data=json.dumps(body).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}',
                'User-Agent': 'smartseason-assistant/1.0',
            },
            method='POST',
        )

        last_error = None

        for attempt in range(len(RETRY_DELAYS) + 1):

            if attempt:
                time.sleep(RETRY_DELAYS[attempt - 1])

            try:
                with urllib.request.urlopen(
                    request,
                    timeout=self.timeout
                ) as response:

                    return json.loads(
                        response.read().decode('utf-8')
                    )

            except urllib.error.HTTPError as e:

                detail = self._error_detail(e)

                logger.warning(
                    'Groq HTTP %s (attempt %s): %s',
                    e.code,
                    attempt + 1,
                    detail
                )

                if e.code == 429:
                    raise LLMError(
                        'The AI service is busy or the free quota '
                        'has been used up. Please try again later.'
                    ) from e

                if e.code in (400, 401, 403, 404):
                    raise LLMError(
                        'The AI service rejected the request. '
                        'Check GROQ_API_KEY and GROQ_MODEL.'
                    ) from e

                if e.code not in RETRY_STATUSES:
                    raise LLMError(
                        'The AI service had a problem. Please try again.'
                    ) from e

                last_error = LLMError(
                    'The AI service is overloaded right now. '
                    'Please try again in a moment.'
                )

            except (urllib.error.URLError, TimeoutError) as e:

                logger.warning(
                    'Groq connection problem (attempt %s): %s',
                    attempt + 1,
                    e
                )

                last_error = LLMError(
                    'Could not reach the AI service. Please try again.'
                )

        raise last_error

    @staticmethod
    def _error_detail(error):
        """Get provider error without exposing the API key."""

        try:
            return error.read().decode(
                'utf-8',
                'replace'
            )[:500]

        except Exception:
            return ''

def get_llm():
    """Build the configured Groq client."""

    api_key = os.environ.get('GROQ_API_KEY')

    if not api_key:
        return None

    return GroqClient(
        api_key=api_key,
        model=os.environ.get(
            'GROQ_MODEL',
            'openai/gpt-oss-20b'
        )
    )