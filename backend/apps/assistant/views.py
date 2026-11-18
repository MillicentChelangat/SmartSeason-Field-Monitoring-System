from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.assistant import agent
from apps.assistant.llm import LLMError, get_llm


MAX_MESSAGE = 1000

@api_view(['POST'])
@permission_classes([IsAuthenticated])  
def chat(request):
    # DRF extracts request.user directly from the token behind the scenes
    user_id = request.user.id 
    
    # DRF already parsed the JSON into a clean Python dictionary
    message = request.data.get('message')
    
    if not isinstance(message, str) or not message.strip():
        return Response({'error': 'Please type a message.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(message) > MAX_MESSAGE:
        return Response({'error': f'Messages can be at most {MAX_MESSAGE} characters.'}, status=status.HTTP_400_BAD_REQUEST)

    llm = get_llm()
    if llm is None:
        return Response({'error': 'The assistant is not set up on this server yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        # Pass the extracted user_id and history directly to your agent
        result = agent.run_chat(user_id, message.strip(), request.data.get('history'), llm)
    except LLMError as e:
        print("LLM ERROR:", e)
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def confirm(request):
    user_id = request.user.id
    token = request.data.get('token')
    
    if not isinstance(token, str) or not token:
        return Response({'error': 'Missing confirmation token.'}, status=status.HTTP_400_BAD_REQUEST)
        
    result = agent.confirm_action(user_id, token, bool(request.data.get('approve')))
    return Response(result)
