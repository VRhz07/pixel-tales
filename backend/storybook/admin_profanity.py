"""
Admin API Views for managing profanity words
Allows admins to add, edit, delete, and list profanity words
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import ProfanityWord
from .admin_decorators import admin_required


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_profanity_words(request):
    """Get list of profanity words with optional filtering"""
    
    # Get query parameters
    search = request.GET.get('search', '').strip()
    language = request.GET.get('language', '')
    severity = request.GET.get('severity', '')
    is_active = request.GET.get('is_active', '')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))
    
    # Build query
    queryset = ProfanityWord.objects.all()
    
    # Apply filters
    if search:
        queryset = queryset.filter(word__icontains=search)
    
    if language and language != 'all':
        queryset = queryset.filter(language=language)
    
    if severity and severity != 'all':
        queryset = queryset.filter(severity=severity)
    
    if is_active:
        queryset = queryset.filter(is_active=is_active.lower() == 'true')
    
    # Get total count
    total_count = queryset.count()
    
    # Apply pagination
    start = (page - 1) * page_size
    end = start + page_size
    words = queryset[start:end]
    
    # Serialize data
    words_data = [{
        'id': word.id,
        'word': word.word,
        'language': word.language,
        'language_display': word.get_language_display(),
        'severity': word.severity,
        'severity_display': word.get_severity_display(),
        'is_active': word.is_active,
        'created_at': word.created_at.isoformat(),
        'updated_at': word.updated_at.isoformat(),
    } for word in words]
    
    return Response({
        'success': True,
        'words': words_data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def add_profanity_word(request):
    """Add a new profanity word"""
    
    word = request.data.get('word', '').strip().lower()
    language = request.data.get('language', 'en')
    severity = request.data.get('severity', 'moderate')
    is_active = request.data.get('is_active', True)
    
    # Validation
    if not word:
        return Response({
            'success': False,
            'error': 'Word is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(word) > 100:
        return Response({
            'success': False,
            'error': 'Word is too long (max 100 characters)'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if word already exists
    if ProfanityWord.objects.filter(word=word).exists():
        return Response({
            'success': False,
            'error': 'This word already exists in the profanity list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate language
    if language not in ['en', 'tl', 'both']:
        return Response({
            'success': False,
            'error': 'Invalid language. Must be: en, tl, or both'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate severity
    if severity not in ['mild', 'moderate', 'severe']:
        return Response({
            'success': False,
            'error': 'Invalid severity. Must be: mild, moderate, or severe'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create new profanity word
    profanity_word = ProfanityWord.objects.create(
        word=word,
        language=language,
        severity=severity,
        is_active=is_active
    )
    
    return Response({
        'success': True,
        'message': 'Profanity word added successfully',
        'word': {
            'id': profanity_word.id,
            'word': profanity_word.word,
            'language': profanity_word.language,
            'language_display': profanity_word.get_language_display(),
            'severity': profanity_word.severity,
            'severity_display': profanity_word.get_severity_display(),
            'is_active': profanity_word.is_active,
            'created_at': profanity_word.created_at.isoformat(),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
@admin_required
def update_profanity_word(request, word_id):
    """Update an existing profanity word"""
    
    try:
        profanity_word = ProfanityWord.objects.get(id=word_id)
    except ProfanityWord.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Profanity word not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get update data
    word = request.data.get('word', profanity_word.word).strip().lower()
    language = request.data.get('language', profanity_word.language)
    severity = request.data.get('severity', profanity_word.severity)
    is_active = request.data.get('is_active', profanity_word.is_active)
    
    # Validation
    if not word:
        return Response({
            'success': False,
            'error': 'Word cannot be empty'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if word already exists (excluding current word)
    if word != profanity_word.word and ProfanityWord.objects.filter(word=word).exists():
        return Response({
            'success': False,
            'error': 'This word already exists in the profanity list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate language
    if language not in ['en', 'tl', 'both']:
        return Response({
            'success': False,
            'error': 'Invalid language. Must be: en, tl, or both'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate severity
    if severity not in ['mild', 'moderate', 'severe']:
        return Response({
            'success': False,
            'error': 'Invalid severity. Must be: mild, moderate, or severe'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update word
    profanity_word.word = word
    profanity_word.language = language
    profanity_word.severity = severity
    profanity_word.is_active = is_active
    profanity_word.save()
    
    return Response({
        'success': True,
        'message': 'Profanity word updated successfully',
        'word': {
            'id': profanity_word.id,
            'word': profanity_word.word,
            'language': profanity_word.language,
            'language_display': profanity_word.get_language_display(),
            'severity': profanity_word.severity,
            'severity_display': profanity_word.get_severity_display(),
            'is_active': profanity_word.is_active,
            'updated_at': profanity_word.updated_at.isoformat(),
        }
    })


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_required
def delete_profanity_word(request, word_id):
    """Delete a profanity word"""
    
    try:
        profanity_word = ProfanityWord.objects.get(id=word_id)
    except ProfanityWord.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Profanity word not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    word_text = profanity_word.word
    profanity_word.delete()
    
    return Response({
        'success': True,
        'message': f'Profanity word "{word_text}" deleted successfully'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def bulk_add_profanity_words(request):
    """Bulk add profanity words from a list"""
    
    words_list = request.data.get('words', [])
    language = request.data.get('language', 'en')
    severity = request.data.get('severity', 'moderate')
    
    if not words_list or not isinstance(words_list, list):
        return Response({
            'success': False,
            'error': 'Words list is required and must be an array'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate language and severity
    if language not in ['en', 'tl', 'both']:
        return Response({
            'success': False,
            'error': 'Invalid language. Must be: en, tl, or both'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if severity not in ['mild', 'moderate', 'severe']:
        return Response({
            'success': False,
            'error': 'Invalid severity. Must be: mild, moderate, or severe'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    added = []
    skipped = []
    
    for word_text in words_list:
        word = word_text.strip().lower()
        
        if not word:
            continue
        
        # Check if word already exists
        if ProfanityWord.objects.filter(word=word).exists():
            skipped.append(word)
            continue
        
        # Create new profanity word
        profanity_word = ProfanityWord.objects.create(
            word=word,
            language=language,
            severity=severity,
            is_active=True
        )
        added.append(word)
    
    return Response({
        'success': True,
        'message': f'Bulk add completed. Added: {len(added)}, Skipped: {len(skipped)}',
        'added_count': len(added),
        'skipped_count': len(skipped),
        'added': added[:10],  # Return first 10 for display
        'skipped': skipped[:10],  # Return first 10 for display
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_profanity_words(request):
    """
    Public endpoint to get active profanity words for filtering
    Used by the frontend profanity filter
    """
    
    language = request.GET.get('language', 'all')
    
    # Build query for active words
    queryset = ProfanityWord.objects.filter(is_active=True)
    
    # Filter by language
    if language and language != 'all':
        queryset = queryset.filter(Q(language=language) | Q(language='both'))
    
    # Get words
    words = queryset.values_list('word', flat=True)
    
    return Response({
        'success': True,
        'words': list(words),
        'count': len(words)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_required
def get_profanity_stats(request):
    """Get statistics about profanity words"""
    
    total_words = ProfanityWord.objects.count()
    active_words = ProfanityWord.objects.filter(is_active=True).count()
    inactive_words = total_words - active_words
    
    # By language
    english_words = ProfanityWord.objects.filter(Q(language='en') | Q(language='both')).count()
    tagalog_words = ProfanityWord.objects.filter(Q(language='tl') | Q(language='both')).count()
    
    # By severity
    mild_words = ProfanityWord.objects.filter(severity='mild').count()
    moderate_words = ProfanityWord.objects.filter(severity='moderate').count()
    severe_words = ProfanityWord.objects.filter(severity='severe').count()
    
    return Response({
        'success': True,
        'stats': {
            'total_words': total_words,
            'active_words': active_words,
            'inactive_words': inactive_words,
            'by_language': {
                'english': english_words,
                'tagalog': tagalog_words,
            },
            'by_severity': {
                'mild': mild_words,
                'moderate': moderate_words,
                'severe': severe_words,
            }
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_required
def import_profanity_words_from_file(request):
    """
    Import profanity words from the export file
    This endpoint allows admins to trigger import via API (for Render free tier)
    """
    import json
    import os
    
    filename = 'profanity_words_export.json'
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        return Response({
            'success': False,
            'error': f'Export file not found at: {file_path}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Read file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to read export file: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    words_data = data.get('words', [])
    
    if not words_data:
        return Response({
            'success': False,
            'error': 'No words found in export file'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Import words
    added = 0
    updated = 0
    skipped = 0
    
    for word_data in words_data:
        word_text = word_data['word'].lower().strip()
        
        existing = ProfanityWord.objects.filter(word=word_text).first()
        
        if existing:
            needs_update = (
                existing.language != word_data['language'] or
                existing.severity != word_data['severity'] or
                existing.is_active != word_data['is_active']
            )
            
            if needs_update:
                existing.language = word_data['language']
                existing.severity = word_data['severity']
                existing.is_active = word_data['is_active']
                existing.save()
                updated += 1
            else:
                skipped += 1
        else:
            ProfanityWord.objects.create(
                word=word_text,
                language=word_data['language'],
                severity=word_data['severity'],
                is_active=word_data['is_active']
            )
            added += 1
    
    return Response({
        'success': True,
        'message': 'Import completed successfully',
        'results': {
            'added': added,
            'updated': updated,
            'skipped': skipped,
            'total_in_database': ProfanityWord.objects.count()
        }
    }, status=status.HTTP_201_CREATED)
