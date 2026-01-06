"""
WebSocket consumers for real-time collaborative drawing
Optimized for memory efficiency on limited resources
"""
import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import CollaborationSession, SessionParticipant, DrawingOperation


class CollaborationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time collaborative drawing
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'collab_{self.session_id}'
        self.user = self.scope.get('user')
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            print(f"❌ User not authenticated for session {self.session_id}")
            await self.close()
            return
        
        # Verify session exists
        session = await self.get_session()
        if not session:
            print(f"❌ Session {self.session_id} not found")
            await self.close()
            return
        
        # Check if user can join (new user) or reconnect (existing participant)
        is_existing_participant = await self.is_existing_participant(session)
        can_join = await self.can_join_session(session)
        
        if not is_existing_participant and not can_join:
            print(f"❌ User {self.user.username} cannot join session {self.session_id}")
            await self.close()
            return
        
        print(f"✅ User {self.user.username} {'reconnecting to' if is_existing_participant else 'joining'} session {self.session_id}")
        
        # If host is reconnecting, clear the disconnection timestamp and reactivate session
        if is_existing_participant and await self.is_user_host():
            await self.mark_host_reconnected()
            print(f"🎉 Host {self.user.username} reconnected to session {self.session_id}")
        
        # Memory optimization: Track active connections for this session
        collab_conn_key = f'collab_connections_{self.session_id}'
        current_connections = cache.get(collab_conn_key, 0)
        
        if current_connections >= 10:  # Max 10 concurrent connections per session
            print(f"⚠️ Session {self.session_id} has reached max connections ({current_connections})")
            await self.close(code=4002)  # Session is full
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Increment connection count
        cache.set(collab_conn_key, current_connections + 1, 7200)  # 2 hour timeout
        
        # Add user as participant
        participant = await self.add_participant(session)
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'username': self.user.username,
                'cursor_color': participant['cursor_color']
            }
        )
        
        # Send current canvas state and draft to the new user
        canvas_data = await self.get_canvas_data(session)
        story_draft = await self.get_story_draft(session)
        participants = await self.get_participants(session)
        
        await self.send(text_data=json.dumps({
            'type': 'init',
            'canvas_data': canvas_data,
            'story_draft': story_draft,
            'participants': participants,
            'your_color': participant['cursor_color'],
            'current_user_id': self.user.id,
            'current_username': self.user.username
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection with memory cleanup"""
        # Decrement connection count for this session
        if hasattr(self, 'session_id'):
            collab_conn_key = f'collab_connections_{self.session_id}'
            current_connections = cache.get(collab_conn_key, 1)
            if current_connections > 0:
                cache.set(collab_conn_key, current_connections - 1, 7200)
        
        if hasattr(self, 'room_group_name'):
            # Determine if this user is the host before removing
            is_host = await self.is_user_host()

            # Mark participant as inactive (but don't remove from database)
            await self.remove_participant()
            
            if is_host:
                # DON'T immediately deactivate session - allow host to reconnect
                # Set a timestamp for when the host disconnected
                await self.mark_host_disconnected()
                
                print(f"⚠️ Host {self.user.username} disconnected from session {self.session_id}")
                print(f"   Session remains active for reconnection grace period")
                
                # Notify participants that host is temporarily disconnected
                # Don't broadcast host_left immediately - give grace period for reconnection
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_left',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'is_host': True,
                        'temporary': True  # Indicate this might be temporary
                    }
                )
            else:
                # Notify others that user left
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_left',
                        'user_id': self.user.id,
                        'username': self.user.username
                    }
                )
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'draw':
                # Handle drawing operation
                await self.handle_draw(data)
            elif message_type == 'cursor':
                # Handle cursor movement
                await self.handle_cursor(data)
            elif message_type == 'clear':
                # Handle canvas clear
                await self.handle_clear(data)
            elif message_type == 'transform':
                # Handle object transformation
                await self.handle_transform(data)
            elif message_type == 'delete':
                # Handle object deletion
                await self.handle_delete(data)
            elif message_type == 'text_edit':
                # Handle text editing
                await self.handle_text_edit(data)
            elif message_type == 'page_change':
                # Handle page navigation
                await self.handle_page_change(data)
            elif message_type == 'presence_update':
                # Handle presence/tool/activity update
                await self.handle_presence_update(data)
            elif message_type == 'title_edit':
                # Handle live title editing
                await self.handle_title_edit(data)
            elif message_type == 'kick_user':
                # Handle host kicking a user
                await self.handle_kick_user(data)
            elif message_type == 'initiate_vote':
                # Handle initiating save vote
                await self.handle_initiate_vote(data)
            elif message_type == 'vote_save':
                # Handle user voting
                await self.handle_vote_save(data)
            elif message_type == 'finalize_collaborative_story':
                # Handle finalizing story after vote initiator saves with genres
                await self.handle_finalize_collaborative_story(data)
            elif message_type == 'add_page':
                # Handle adding a new page
                await self.handle_add_page(data)
            elif message_type == 'delete_page':
                # Handle deleting a page
                await self.handle_delete_page(data)
            elif message_type == 'text_edit_advanced':
                # Handle advanced text editing with full formatting
                await self.handle_text_edit_advanced(data)
            elif message_type == 'layer_operation':
                # Handle layer operations (create, update, delete, reorder)
                await self.handle_layer_operation(data)
            elif message_type == 'transform_operation':
                # Handle object transformation operations
                await self.handle_transform_operation(data)
            elif message_type == 'delete_item':
                # Handle item deletion
                await self.handle_delete_item(data)
            elif message_type == 'canvas_snapshot':
                # Handle full canvas snapshot (for saving state)
                await self.handle_canvas_snapshot(data)
            elif message_type == 'request_sync':
                # Handle request for canvas sync after reconnection
                await self.handle_request_sync(data)
            elif message_type == 'canvas_state':
                # Handle canvas state being sent to a specific user
                await self.handle_canvas_state(data)
            elif message_type == 'get_page_viewers':
                # Handle request for page viewer information
                await self.handle_get_page_viewers(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_draw(self, data):
        """Handle drawing operations with page information for cross-page collaboration"""
        # Extract page information
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        is_cover_image = data.get('is_cover_image', False)
        canvas_snapshot = data.get('canvas_snapshot')  # Optional full canvas state
        
        # Save operation to database with page context
        await self.save_operation('draw', {
            'drawing_data': data.get('data', {}),
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        # Update canvas data if snapshot provided (for reconnection support)
        if canvas_snapshot:
            await self.update_canvas_snapshot(page_id, is_cover_image, canvas_snapshot)
        
        # Broadcast to all users in the room with page information
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'drawing_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'operation': 'draw',
                'data': data.get('data', {}),
                'page_id': page_id,
                'page_index': page_index,
                'is_cover_image': is_cover_image
            }
        )
    
    async def handle_cursor(self, data):
        """Handle cursor position updates with canvas context"""
        position = data.get('position', {})
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        is_cover_image = data.get('is_cover_image', False)
        
        # Update cursor position in database
        await self.update_cursor_position(position)
        
        # Get user's cursor color
        cursor_color = await self.get_user_cursor_color()
        
        # Broadcast cursor position to others with canvas context and color
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'cursor_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'cursor_color': cursor_color,
                'position': position,
                'page_id': page_id,
                'page_index': page_index,
                'is_cover_image': is_cover_image
            }
        )
    
    async def handle_clear(self, data):
        """Handle canvas clear with page information"""
        # Extract page information
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        is_cover_image = data.get('is_cover_image', False)
        
        await self.save_operation('clear', {
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'canvas_cleared',
                'user_id': self.user.id,
                'username': self.user.username,
                'page_id': page_id,
                'page_index': page_index,
                'is_cover_image': is_cover_image
            }
        )
    
    async def handle_transform(self, data):
        """Handle object transformation"""
        await self.save_operation('transform', data.get('data', {}))
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'object_transformed',
                'user_id': self.user.id,
                'username': self.user.username,
                'data': data.get('data', {})
            }
        )
    
    async def handle_delete(self, data):
        """Handle object deletion"""
        await self.save_operation('delete', data.get('data', {}))
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'object_deleted',
                'user_id': self.user.id,
                'username': self.user.username,
                'data': data.get('data', {})
            }
        )
    
    async def handle_title_edit(self, data):
        """Handle live title editing - persist to server draft and broadcast"""
        title = data.get('title', '').strip()
        if title is None:
            title = ''
        
        # Persist to draft
        await self.update_story_draft_title(title)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'title_updated',
                'user_id': self.user.id,
                'username': self.user.username,
                'title': title
            }
        )

    async def handle_text_edit(self, data):
        """Handle text editing operations - persist to backend draft"""
        # page_index is the authoritative position indicator; page_id is local-only
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        text_content = data.get('text', '')

        # Fallback: if page_index missing, treat page_id as index (legacy clients)
        if page_index is None and isinstance(page_id, int):
            page_index = page_id
        if page_index is None:
            page_index = 0
        
        # Save operation (for history)
        await self.save_operation('text_edit', {
            'page_id': page_id,
            'page_index': page_index,
            'text': text_content
        }, page_index)
        
        # Update the session draft (server-side source of truth)
        await self.update_story_draft_text(page_index, text_content)
        
        # Increment operation count and check for auto-save
        await self.increment_operation_count()
        
        # Broadcast to all users (reflect new text)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'text_updated',
                'user_id': self.user.id,
                'username': self.user.username,
                'page_id': page_id,
                'page_index': page_index,
                'text': text_content
            }
        )
    
    async def handle_page_change(self, data):
        """Handle page navigation"""
        page_number = data.get('page_number', 0)
        
        # Persist page change for guard checks and history
        await self.save_operation('page_change', { 'page_number': page_number })
        
        # Update session's current page (global, for backward compatibility)
        await self.update_current_page(page_number)
        
        # Broadcast page change
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'page_changed',
                'user_id': self.user.id,
                'username': self.user.username,
                'page_number': page_number
            }
        )
    
    async def handle_presence_update(self, data):
        """Handle user presence updates (cursor, tool, activity)"""
        cursor_position = data.get('cursor_position')
        current_tool = data.get('current_tool')
        activity = data.get('activity')  # e.g., 'typing_title', 'typing_text', 'idle'
        
        # Update in database
        await self.update_presence(cursor_position, current_tool)
        
        # Broadcast to others
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_updated',
                'user_id': self.user.id,
                'username': self.user.username,
                'cursor_position': cursor_position,
                'current_tool': current_tool,
                'activity': activity
            }
        )
    
    async def handle_kick_user(self, data):
        """Handle host kicking a user"""
        # Verify sender is host
        is_host = await self.is_user_host()
        if not is_host:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Only host can kick users'
            }))
            return
        
        kicked_user_id = data.get('user_id')
        if not kicked_user_id:
            return
        
        # Remove participant
        await self.remove_participant_by_id(kicked_user_id)
        
        # Notify all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_kicked',
                'kicked_user_id': kicked_user_id,
                'by_user': self.user.username
            }
        )
    
    async def handle_initiate_vote(self, data):
        """Handle initiating a save vote"""
        # Start voting
        await self.start_voting()
        
        # Notify all participants
        participant_count = await self.get_active_participant_count()
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'vote_initiated',
                'initiated_by': self.user.id,  # Send user ID
                'initiated_by_username': self.user.username,  # Also send username for display
                'required_votes': participant_count
            }
        )
    
    async def handle_finalize_collaborative_story(self, data):
        """Handle finalizing collaborative story after vote initiator saves with genres"""
        try:
            print(f"🎬 Finalizing collaborative story for session {self.session_id}")
            
            # Finalize the story
            story_data = await self.finalize_story()
            print(f"✅ Story finalized: {story_data}")
            
            # Notify all participants that story is saved
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'story_finalized',
                    'story_id': story_data['story_id'],
                    'message': 'Story saved to all participants!'
                }
            )
            print(f"📤 Broadcasted story_finalized to {self.room_group_name}")
            
            # End the session for all participants
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'session_ended',
                    'session_id': self.session_id,
                    'story_title': story_data['title'],
                    'ended_by': 'vote'
                }
            )
            print(f"📤 Broadcasted session_ended to {self.room_group_name}")
        except Exception as e:
            print(f"❌ Error in handle_finalize_collaborative_story: {e}")
            import traceback
            traceback.print_exc()
            # Send error to client
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to finalize story: {str(e)}'
            }))
    
    async def handle_vote_save(self, data):
        """Handle user voting to save"""
        vote = data.get('vote', False)  # True = agree, False = disagree
        
        # Record vote
        voting_data = await self.record_vote(vote)
        
        # Check if all voted
        participant_count = await self.get_active_participant_count()
        votes = list(voting_data.values())
        
        # Broadcast vote update
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'vote_updated',
                'voting_data': voting_data,
                'required_votes': participant_count,
                'current_votes': len(votes)
            }
        )
        
        # Check if voting is complete
        if len(votes) >= participant_count and participant_count > 0:
            if all(votes):  # All agreed
                # DON'T finalize yet - vote initiator needs to select genres first
                # Just broadcast vote result
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'vote_result',
                        'vote_id': f'vote_{self.session_id}',
                        'approved': True,
                        'yes_votes': len([v for v in votes if v]),
                        'no_votes': len([v for v in votes if not v]),
                        'total_participants': participant_count,
                        'vote_initiator_id': list(voting_data.keys())[0]  # First voter is initiator
                    }
                )
            else:
                # Some disagreed, reset voting
                await self.reset_voting()
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'vote_failed',
                        'message': 'Not everyone agreed. Continue editing!'
                    }
                )
    
    async def handle_add_page(self, data):
        """Handle adding a new page"""
        page_data = data.get('page_data', {})
        # Optional: include an explicit page_index if client sent one
        requested_index = data.get('page_index')

        # Update the server-side draft and determine the actual index and ID
        result = await self.add_page_to_draft(requested_index)
        page_data = { 
            **page_data, 
            'page_index': result['index'],
            'id': result['id']
        }
        
        await self.save_operation('add_page', page_data)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'page_added',
                'user_id': self.user.id,
                'username': self.user.username,
                'page_data': page_data
            }
        )
    
    async def handle_delete_page(self, data):
        """Handle deleting a page"""
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        
        # Validate page_index
        if page_index is None:
            page_index = await self.resolve_page_index_from_id(page_id)
        
        if page_index is None or page_index < 0:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid page index for deletion'
            }))
            return
        
        # Prevent deletion if any active participant is on that page
        if await self.is_anyone_on_page(page_index):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Cannot delete a page currently being viewed by another participant'
            }))
            return
        
        # Update server-side draft and check if successful
        deleted = await self.delete_page_from_draft(page_index)
        
        if not deleted:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to delete page - page may not exist'
            }))
            return
        
        await self.save_operation('delete_page', {'page_id': page_id, 'page_index': page_index})
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'page_deleted',
                'user_id': self.user.id,
                'username': self.user.username,
                'page_id': page_id,
                'page_index': page_index
            }
        )
    
    async def handle_text_edit_advanced(self, data):
        """Handle advanced text editing with full formatting"""
        text_data = data.get('data', {})
        page_id = text_data.get('pageId')
        page_index = text_data.get('pageIndex')
        is_cover_image = text_data.get('isCoverImage', False)
        
        # Save operation for history
        await self.save_operation('text_edit_advanced', {
            'text_data': text_data,
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'text_edit_advanced_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'data': text_data
            }
        )
    
    async def handle_layer_operation(self, data):
        """Handle layer operations (create, update, delete, reorder)"""
        operation = data.get('operation')
        layer_data = data.get('data', {})
        page_id = layer_data.get('pageId')
        page_index = layer_data.get('pageIndex')
        is_cover_image = layer_data.get('isCoverImage', False)
        
        # Save operation for history
        await self.save_operation('layer_operation', {
            'operation': operation,
            'layer_data': layer_data,
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'layer_operation_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'operation': operation,
                'data': layer_data
            }
        )
    
    async def handle_transform_operation(self, data):
        """Handle object transformation operations"""
        transform_data = data.get('data', {})
        page_id = transform_data.get('pageId')
        page_index = transform_data.get('pageIndex')
        is_cover_image = transform_data.get('isCoverImage', False)
        
        # Save operation for history
        await self.save_operation('transform_operation', {
            'transform_data': transform_data,
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'transform_operation_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'data': transform_data
            }
        )
    
    async def handle_delete_item(self, data):
        """Handle item deletion operations"""
        delete_data = data.get('data', {})
        page_id = delete_data.get('pageId')
        page_index = delete_data.get('pageIndex')
        is_cover_image = delete_data.get('isCoverImage', False)
        
        # Save operation for history
        await self.save_operation('delete_item', {
            'delete_data': delete_data,
            'page_id': page_id,
            'page_index': page_index,
            'is_cover_image': is_cover_image
        }, page_index if page_index is not None else 0)
        
        # Broadcast to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'delete_item_update',
                'user_id': self.user.id,
                'username': self.user.username,
                'data': delete_data
            }
        )
    
    async def handle_canvas_snapshot(self, data):
        """Handle full canvas snapshot for persistence"""
        page_id = data.get('page_id')
        is_cover_image = data.get('is_cover_image', False)
        canvas_data_url = data.get('canvas_data_url')
        
        if canvas_data_url:
            await self.update_canvas_snapshot(page_id, is_cover_image, canvas_data_url)
    
    async def handle_request_sync(self, data):
        """Handle request for canvas sync after reconnection"""
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        is_cover_image = data.get('is_cover_image', False)
        
        print(f"📥 User {self.user.username} requesting canvas sync for page_id={page_id}, is_cover={is_cover_image}")
        
        # First, try to get canvas state from the database
        canvas_state = await self.get_canvas_state_from_db(page_id, is_cover_image)
        
        if canvas_state:
            print(f"✅ Found canvas state in database, sending directly to user")
            # Send canvas state directly from database
            await self.send(text_data=json.dumps({
                'type': 'canvas_state',
                'canvas_data': canvas_state,
                'page_id': page_id,
                'page_index': page_index,
                'is_cover_image': is_cover_image,
                'sender_user_id': 'server'  # Indicate it came from server
            }))
        else:
            print(f"⚠️ No canvas state in database, requesting from other participants")
            # Request canvas state from other participants as fallback
            await self.channel_layer.group_send(
                self.session_group_name,
                {
                    'type': 'request_canvas_state',
                    'requesting_user_id': self.user.id,
                    'page_id': page_id,
                    'page_index': page_index,
                    'is_cover_image': is_cover_image
                }
            )
    
    async def handle_canvas_state(self, data):
        """Handle canvas state being sent to a specific user or for autosave"""
        target_user_id = data.get('target_user_id')
        canvas_data = data.get('canvas_data')
        page_id = data.get('page_id')
        page_index = data.get('page_index')
        is_cover_image = data.get('is_cover_image', False)
        
        # Save canvas state to database for future reconnections
        if canvas_data:
            await self.save_canvas_state_to_db(page_id, is_cover_image, canvas_data)
        
        # If target_user_id is 0, this is just an autosave, don't send to other users
        if target_user_id == 0:
            print(f"💾 User {self.user.username} auto-saved canvas state for page_id={page_id}")
            return
        
        print(f"📤 User {self.user.username} sending canvas state to user {target_user_id}")
        
        # Send canvas state to the specific user
        await self.channel_layer.group_send(
            self.session_group_name,
            {
                'type': 'receive_canvas_state',
                'target_user_id': target_user_id,
                'canvas_data': canvas_data,
                'page_id': page_id,
                'page_index': page_index,
                'is_cover_image': is_cover_image,
                'sender_user_id': self.user.id
            }
        )
    
    # Event handlers for group messages
    async def request_canvas_state(self, event):
        """Notify clients that someone is requesting canvas sync"""
        # Don't send to the requesting user
        if event['requesting_user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'request_canvas_state',
                'requesting_user_id': event['requesting_user_id'],
                'page_id': event.get('page_id'),
                'page_index': event.get('page_index'),
                'is_cover_image': event.get('is_cover_image', False)
            }))
    
    async def receive_canvas_state(self, event):
        """Send canvas state to the target user only"""
        # Only send to the target user
        if event['target_user_id'] == self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'canvas_state',
                'canvas_data': event.get('canvas_data'),
                'page_id': event.get('page_id'),
                'page_index': event.get('page_index'),
                'is_cover_image': event.get('is_cover_image', False),
                'sender_user_id': event.get('sender_user_id')
            }))
    
    async def user_joined(self, event):
        """Send user joined notification"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user_id': event['user_id'],
                'username': event['username'],
                'cursor_color': event['cursor_color']
            }))
    
    async def user_left(self, event):
        """Send user left notification"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'user_id': event['user_id'],
                'username': event['username']
            }))

    async def host_left(self, event):
        """Notify clients that host left - force disconnect on clients"""
        await self.send(text_data=json.dumps({
            'type': 'host_left',
            'session_id': event['session_id'],
            'username': event['username']
        }))
        # Close connection for everyone still in the room
        await self.close()
    
    async def drawing_update(self, event):
        """Send drawing update to client with page information"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'draw',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data'],
                'page_id': event.get('page_id'),
                'page_index': event.get('page_index'),
                'is_cover_image': event.get('is_cover_image', False)
            }))
    
    async def cursor_update(self, event):
        """Send cursor update to client with canvas context"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'cursor',
                'user_id': event['user_id'],
                'username': event['username'],
                'cursor_color': event.get('cursor_color', '#FF0000'),
                'position': event['position'],
                'page_id': event.get('page_id'),
                'page_index': event.get('page_index'),
                'is_cover_image': event.get('is_cover_image', False)
            }))
    
    async def canvas_cleared(self, event):
        """Send canvas clear notification with page information"""
        await self.send(text_data=json.dumps({
            'type': 'clear',
            'user_id': event['user_id'],
            'username': event['username'],
            'page_id': event.get('page_id'),
            'page_index': event.get('page_index'),
            'is_cover_image': event.get('is_cover_image', False)
        }))
    
    async def object_transformed(self, event):
        """Send object transformation"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'transform',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data']
            }))
    
    async def object_deleted(self, event):
        """Send object deletion"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'delete',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data']
            }))
    
    async def text_updated(self, event):
        """Send text update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'text_edit',
                'user_id': event['user_id'],
                'username': event['username'],
                'page_id': event.get('page_id'),
                'page_index': event.get('page_index'),
                'text': event['text']
            }))

    async def title_updated(self, event):
        """Send title update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'title_edit',
                'user_id': event['user_id'],
                'username': event['username'],
                'title': event['title']
            }))
    
    async def page_changed(self, event):
        """Send page change notification"""
        await self.send(text_data=json.dumps({
            'type': 'page_change',
            'user_id': event['user_id'],
            'username': event['username'],
            'page_number': event['page_number']
        }))
    
    async def presence_updated(self, event):
        """Send presence update to client"""
        if event['user_id'] != self.user.id:
            cursor_pos = event.get('cursor_position')
            
            # Ensure cursor_position is properly serializable
            if cursor_pos and isinstance(cursor_pos, dict):
                # Convert to plain dict to ensure JSON serialization
                cursor_pos = dict(cursor_pos)
            
            message_data = {
                'type': 'presence_update',
                'user_id': event['user_id'],
                'username': event['username'],
                'cursor_position': cursor_pos,
                'current_tool': event['current_tool'],
                'activity': event.get('activity')
            }
            
            await self.send(text_data=json.dumps(message_data))
    
    async def user_kicked(self, event):
        """Send user kicked notification"""
        await self.send(text_data=json.dumps({
            'type': 'user_kicked',
            'kicked_user_id': event['kicked_user_id'],
            'by_user': event['by_user']
        }))
        
        # If this user was kicked, disconnect them
        if event['kicked_user_id'] == self.user.id:
            await self.close()
    
    async def vote_initiated(self, event):
        """Send vote initiation notification"""
        print(f"🗳️🗳️🗳️ vote_initiated handler called with event: {event}")
        message = {
            'type': 'vote_initiated',
            'vote_id': event.get('vote_id'),
            'initiated_by': event.get('initiated_by'),
            'initiated_by_username': event.get('initiated_by_username'),
            'total_participants': event.get('total_participants'),
            'question': event.get('question', 'Save and end the collaboration session?')
        }
        print(f"📤📤📤 Sending vote_initiated message to WebSocket: {message}")
        await self.send(text_data=json.dumps(message))
        print(f"✅✅✅ vote_initiated message sent successfully")
    
    async def vote_updated(self, event):
        """Send vote update"""
        await self.send(text_data=json.dumps({
            'type': 'vote_update',
            'vote_id': event.get('vote_id'),
            'voting_data': event.get('voting_data', {}),
            'yes_count': event.get('yes_count', 0),
            'no_count': event.get('no_count', 0),
            'current_votes': event.get('current_votes', 0),
            'total_participants': event.get('total_participants', 0)
        }))
    
    async def story_finalized(self, event):
        """Send story finalized notification"""
        await self.send(text_data=json.dumps({
            'type': 'story_finalized',
            'story_id': event['story_id'],
            'message': event['message']
        }))
    
    async def vote_failed(self, event):
        """Send vote failed notification"""
        await self.send(text_data=json.dumps({
            'type': 'vote_failed',
            'message': event['message']
        }))
    
    async def vote_result(self, event):
        """Send vote result notification"""
        await self.send(text_data=json.dumps({
            'type': 'vote_result',
            'vote_id': event.get('vote_id'),
            'approved': event.get('approved', False),
            'yes_votes': event.get('yes_votes', 0),
            'no_votes': event.get('no_votes', 0),
            'total_participants': event.get('total_participants', 0)
        }))
    
    async def session_started(self, event):
        """Send session started notification to all participants"""
        print(f"✅ session_started handler called: {event}")
        await self.send(text_data=json.dumps({
            'type': 'session_started',
            'session_id': event.get('session_id'),
            'story_title': event.get('story_title')
        }))
    
    async def session_ended(self, event):
        """Send session ended notification"""
        print(f"🎬 session_ended handler called: {event}")
        await self.send(text_data=json.dumps({
            'type': 'session_ended',
            'session_id': event.get('session_id'),
            'story_title': event.get('story_title'),
            'ended_by': event.get('ended_by')
        }))
    
    async def page_added(self, event):
        """Send page added notification"""
        await self.send(text_data=json.dumps({
            'type': 'page_added',
            'user_id': event['user_id'],
            'username': event['username'],
            'page_data': event['page_data']
        }))
    
    async def page_deleted(self, event):
        """Send page deleted notification"""
        await self.send(text_data=json.dumps({
            'type': 'page_deleted',
            'user_id': event['user_id'],
            'username': event['username'],
            'page_id': event.get('page_id'),
            'page_index': event.get('page_index')
        }))
    
    async def text_edit_advanced_update(self, event):
        """Send advanced text edit update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'text_edit_advanced',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data']
            }))
    
    async def layer_operation_update(self, event):
        """Send layer operation update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'layer_operation',
                'user_id': event['user_id'],
                'username': event['username'],
                'operation': event['operation'],
                'data': event['data']
            }))
    
    async def transform_operation_update(self, event):
        """Send transform operation update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'transform_operation',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data']
            }))
    
    async def delete_item_update(self, event):
        """Send delete item update to client"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'delete_item',
                'user_id': event['user_id'],
                'username': event['username'],
                'data': event['data']
            }))
    
    # Database operations

    @database_sync_to_async
    def add_page_to_draft(self, requested_index=None):
        """Append a new empty page to the server-side draft and return its index and generated ID.
        If requested_index is provided and within range, insert at that index; otherwise append.
        """
        session = CollaborationSession.objects.get(session_id=self.session_id)
        draft = session.story_draft or {}
        pages = draft.get('pages')
        if not isinstance(pages, list):
            pages = []
        
        # Generate a unique page ID
        page_id = str(uuid.uuid4())
        
        # Determine index
        if isinstance(requested_index, int) and 0 <= requested_index <= len(pages):
            pages.insert(requested_index, { 'text': '', 'id': page_id })
            actual_index = requested_index
        else:
            pages.append({ 'text': '', 'id': page_id })
            actual_index = len(pages) - 1
        
        draft['pages'] = pages
        session.story_draft = draft
        session.save(update_fields=['story_draft'])
        
        return {'index': actual_index, 'id': page_id}

    @database_sync_to_async
    def delete_page_from_draft(self, page_index: int):
        """Delete a page from the server-side draft by index (no-op if out of range)."""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        draft = session.story_draft or {}
        pages = draft.get('pages')
        if not isinstance(pages, list):
            return False
        if 0 <= page_index < len(pages):
            pages.pop(page_index)
            draft['pages'] = pages
            session.story_draft = draft
            session.save(update_fields=['story_draft'])
            return True
        return False

    @database_sync_to_async
    def resolve_page_index_from_id(self, page_id):
        """Resolve page index from an id if client sends legacy id-based reference.
        Because pages in draft are anonymous objects, return None for now.
        """
        return None

    @database_sync_to_async
    def is_anyone_on_page(self, page_index: int):
        """Return True if any active participant other than the requester is on the given page.
        We infer per-user page using each participant's last 'page_change' operation.
        """
        from collections import defaultdict
        
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            
            # Get all active participants except the current user
            active_participants = SessionParticipant.objects.filter(
                session=session, 
                is_active=True
            ).exclude(user=self.user)
            
            # Check each participant's last page_change operation
            for participant in active_participants:
                try:
                    last_page_operation = DrawingOperation.objects.filter(
                        session=session,
                        user=participant.user,
                        operation_type='page_change'
                    ).order_by('-timestamp').first()
                    
                    if last_page_operation:
                        operation_data = last_page_operation.operation_data or {}
                        participant_page = operation_data.get('page_number', 0)
                        
                        if participant_page == page_index:
                            return True
                            
                except Exception as e:
                    print(f"Error checking page for participant {participant.user.username}: {e}")
                    continue
                    
            return False
            
        except Exception as e:
            print(f"Error in is_anyone_on_page: {e}")
            return True  # Err on the side of caution

    @database_sync_to_async  
    def get_page_viewers(self):
        """Get a mapping of page indices to the users currently viewing them."""
        from collections import defaultdict
        
        page_viewers = defaultdict(list)
        
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            
            # Get all active participants
            active_participants = SessionParticipant.objects.filter(
                session=session, 
                is_active=True
            )
            
            # Check each participant's current page
            for participant in active_participants:
                try:
                    last_page_operation = DrawingOperation.objects.filter(
                        session=session,
                        user=participant.user,
                        operation_type='page_change'
                    ).order_by('-timestamp').first()
                    
                    current_page = 0  # Default to page 0
                    if last_page_operation:
                        operation_data = last_page_operation.operation_data or {}
                        current_page = operation_data.get('page_number', 0)
                    
                    # Add user info to the page viewers list
                    # Ensure all values are JSON serializable
                    user_info = {
                        'user_id': int(participant.user.id),
                        'username': str(participant.user.username),
                        'display_name': str(getattr(participant.user, 'display_name', participant.user.username)),
                        'cursor_color': str(participant.cursor_color) if participant.cursor_color else '#808080'
                    }
                    page_viewers[current_page].append(user_info)
                    
                except Exception as e:
                    print(f"Error getting page for participant {participant.user.username}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error in get_page_viewers: {e}")
            
        return dict(page_viewers)
    
    async def handle_get_page_viewers(self, data):
        """Handle request for page viewer information"""
        page_viewers = await self.get_page_viewers()
        
        # Convert to regular dict with proper JSON serialization
        # Keep page indices as integers for proper frontend parsing
        page_viewers_json = {}
        for page_index, viewers in page_viewers.items():
            # Use integer keys to match frontend expectations
            page_viewers_json[int(page_index)] = list(viewers)
        
        print(f"📊 Sending page viewers: {page_viewers_json}")
        print(f"📊 Total pages with viewers: {len(page_viewers_json)}")
        for page_idx, viewers in page_viewers_json.items():
            print(f"   Page {page_idx}: {[v['username'] for v in viewers]}")
        
        await self.send(text_data=json.dumps({
            'type': 'page_viewers_response',
            'page_viewers': page_viewers_json
        }))

    @database_sync_to_async
    def get_session(self):
        """Get collaboration session"""
        try:
            return CollaborationSession.objects.get(session_id=self.session_id)
        except CollaborationSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def is_existing_participant(self, session):
        """Check if user is already a participant in the session (for reconnection)"""
        try:
            participant = SessionParticipant.objects.get(session=session, user=self.user)
            # User is a participant if they exist, regardless of is_active status
            # This allows reconnection even if they were marked inactive
            return True
        except SessionParticipant.DoesNotExist:
            return False
    
    @database_sync_to_async
    def can_join_session(self, session):
        """Check if user can join session"""
        # Allow joining if session is normally open
        if session.can_join():
            return True
        
        # Also allow if session was recently active (host might be reconnecting)
        # Check if session became inactive recently due to host disconnect
        if not session.is_active and session.canvas_state:
            host_disconnected_at = session.canvas_state.get('host_disconnected_at')
            if host_disconnected_at:
                from django.utils import timezone
                from datetime import datetime, timedelta
                try:
                    disconnect_time = datetime.fromisoformat(host_disconnected_at)
                    # Make disconnect_time timezone-aware if it isn't
                    if disconnect_time.tzinfo is None:
                        disconnect_time = timezone.make_aware(disconnect_time)
                    
                    # Allow reconnection within 5 minutes of host disconnect
                    grace_period = timedelta(minutes=5)
                    if timezone.now() - disconnect_time < grace_period:
                        print(f"🕐 Allowing join during grace period (host disconnected {(timezone.now() - disconnect_time).seconds}s ago)")
                        return True
                except (ValueError, TypeError) as e:
                    print(f"⚠️ Error parsing disconnect time: {e}")
        
        return False
    
    @database_sync_to_async
    def add_participant(self, session):
        """Add user as participant"""
        # Generate random cursor color
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
        import random
        cursor_color = random.choice(colors)
        
        participant, created = SessionParticipant.objects.get_or_create(
            session=session,
            user=self.user,
            defaults={'cursor_color': cursor_color}
        )
        
        if not created:
            # Always regenerate cursor color for rejoining users
            participant.cursor_color = cursor_color
            participant.is_active = True
            participant.save()
        
        return {
            'cursor_color': participant.cursor_color
        }
    
    @database_sync_to_async
    def remove_participant(self):
        """Mark participant as inactive"""
        try:
            participant = SessionParticipant.objects.get(
                session__session_id=self.session_id,
                user=self.user
            )
            participant.is_active = False
            participant.save()
        except SessionParticipant.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_host_disconnected(self):
        """Mark timestamp when host disconnected (for reconnection grace period)"""
        from django.utils import timezone
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            # Use canvas_state JSON field to store temporary disconnection data
            canvas_state = session.canvas_state or {}
            canvas_state['host_disconnected_at'] = timezone.now().isoformat()
            session.canvas_state = canvas_state
            # Keep session active for reconnection - don't deactivate immediately
            session.save(update_fields=['canvas_state'])
            print(f"📝 Marked host disconnection time for session {self.session_id}")
        except CollaborationSession.DoesNotExist:
            pass
    
    @database_sync_to_async
    def mark_host_reconnected(self):
        """Clear host disconnection timestamp and ensure session is active"""
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            # Clear disconnection timestamp from canvas_state
            canvas_state = session.canvas_state or {}
            canvas_state.pop('host_disconnected_at', None)
            session.canvas_state = canvas_state
            # Ensure session is active
            session.is_active = True
            session.save(update_fields=['is_active', 'canvas_state'])
            print(f"✅ Cleared host disconnection time for session {self.session_id}")
        except CollaborationSession.DoesNotExist:
            pass
    
    @database_sync_to_async
    def deactivate_session(self):
        """Deactivate session when host leaves (permanently)"""
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            session.is_active = False
            session.is_lobby_open = False
            session.save(update_fields=['is_active', 'is_lobby_open'])
        except CollaborationSession.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_canvas_data(self, session):
        """Get current canvas data"""
        return session.canvas_data
    
    @database_sync_to_async
    def update_canvas_snapshot(self, page_id, is_cover_image, canvas_data_url):
        """Update canvas snapshot for a specific page or cover"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        canvas_data = session.canvas_data or {}
        
        if is_cover_image:
            canvas_data['cover_image'] = canvas_data_url
        else:
            if 'pages' not in canvas_data:
                canvas_data['pages'] = {}
            canvas_data['pages'][str(page_id)] = canvas_data_url
        
        session.canvas_data = canvas_data
        session.save(update_fields=['canvas_data'])
    
    @database_sync_to_async
    def save_canvas_state_to_db(self, page_id, is_cover_image, canvas_state_data):
        """Save complete canvas state (not just snapshot) to database"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        canvas_state = session.canvas_state or {}
        
        if is_cover_image:
            canvas_state['cover_image'] = canvas_state_data
        else:
            if 'pages' not in canvas_state:
                canvas_state['pages'] = {}
            canvas_state['pages'][str(page_id)] = canvas_state_data
        
        session.canvas_state = canvas_state
        session.save(update_fields=['canvas_state'])
        print(f"💾 Saved canvas state to database for page_id={page_id}, is_cover={is_cover_image}")
    
    @database_sync_to_async
    def get_canvas_state_from_db(self, page_id, is_cover_image):
        """Get canvas state from database"""
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            canvas_state = session.canvas_state or {}
            
            if is_cover_image:
                return canvas_state.get('cover_image')
            else:
                pages = canvas_state.get('pages', {})
                return pages.get(str(page_id))
        except Exception as e:
            print(f"❌ Error getting canvas state from DB: {e}")
            return None
    
    @database_sync_to_async
    def get_story_draft(self, session):
        """Get current story draft"""
        return session.story_draft or {}
    
    @database_sync_to_async
    def update_story_draft_title(self, title: str):
        """Update the story draft title (server-side source of truth)"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        draft = session.story_draft or {}
        draft['title'] = title or ''
        session.story_draft = draft
        session.save(update_fields=['story_draft'])

    @database_sync_to_async
    def update_story_draft_text(self, page_index: int, text: str):
        """Update the story draft text for a specific page (server-side source of truth)"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        draft = session.story_draft or {}
        
        # Ensure pages array exists
        pages = draft.get('pages')
        if not isinstance(pages, list):
            pages = []
        
        # Grow pages to required length
        while len(pages) <= page_index:
            pages.append({ 'text': '' })
        
        # Update text at index
        pages[page_index]['text'] = text
        draft['pages'] = pages
        
        # Optional: set a default title if missing
        if not draft.get('title'):
            draft['title'] = 'Collaborative Story'
        
        session.story_draft = draft
        session.save(update_fields=['story_draft'])
    
    @database_sync_to_async
    def get_participants(self, session):
        """Get list of active participants"""
        participants = SessionParticipant.objects.filter(
            session=session,
            is_active=True
        ).select_related('user')
        
        return [
            {
                'user_id': p.user.id,
                'username': p.user.username,
                'cursor_color': p.cursor_color
            }
            for p in participants
        ]
    
    @database_sync_to_async
    def save_operation(self, operation_type, operation_data, page_number=0):
        """Save drawing operation to database"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        
        # Get next sequence number
        last_op = DrawingOperation.objects.filter(session=session).order_by('-sequence_number').first()
        sequence_number = (last_op.sequence_number + 1) if last_op else 0
        
        DrawingOperation.objects.create(
            session=session,
            user=self.user,
            operation_type=operation_type,
            operation_data=operation_data,
            sequence_number=sequence_number,
            page_number=page_number
        )
    
    @database_sync_to_async
    def update_cursor_position(self, position):
        """Update cursor position in database"""
        try:
            participant = SessionParticipant.objects.get(
                session__session_id=self.session_id,
                user=self.user
            )
            participant.cursor_position = position
            participant.save()
        except SessionParticipant.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_user_cursor_color(self):
        """Get user's cursor color"""
        try:
            participant = SessionParticipant.objects.get(
                session__session_id=self.session_id,
                user=self.user
            )
            return participant.cursor_color
        except SessionParticipant.DoesNotExist:
            return '#FF0000'  # Default red if not found
    
    @database_sync_to_async
    def increment_operation_count(self):
        """Increment operation count and auto-save if needed"""
        from django.utils import timezone
        session = CollaborationSession.objects.get(session_id=self.session_id)
        session.operation_count += 1
        
        # Check if we should auto-save (every 10 operations or 30 seconds)
        should_save = False
        if session.operation_count >= 10:
            should_save = True
        elif session.last_autosave:
            time_diff = timezone.now() - session.last_autosave
            if time_diff.total_seconds() >= 30:
                should_save = True
        else:
            should_save = True  # First save
        
        if should_save:
            # Perform auto-save (save current canvas state)
            # This will be implemented when we have the canvas data
            session.last_autosave = timezone.now()
            session.operation_count = 0
        
        session.save()
    
    @database_sync_to_async
    def update_current_page(self, page_number):
        """Update session's current page"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        session.current_page = page_number
        session.save()
    
    @database_sync_to_async
    def update_presence(self, cursor_position, current_tool):
        """Update user presence data"""
        try:
            participant = SessionParticipant.objects.get(
                session__session_id=self.session_id,
                user=self.user
            )
            # Always update cursor position, even if None (to clear it)
            participant.cursor_position = cursor_position or {}
            if current_tool is not None:
                participant.current_tool = current_tool
            participant.save()
        except SessionParticipant.DoesNotExist:
            pass
    
    @database_sync_to_async
    def is_user_host(self):
        """Check if current user is the host"""
        try:
            session = CollaborationSession.objects.get(session_id=self.session_id)
            return session.host_id == self.user.id
        except CollaborationSession.DoesNotExist:
            return False
    
    @database_sync_to_async
    def remove_participant_by_id(self, user_id):
        """Remove a participant by user ID"""
        try:
            participant = SessionParticipant.objects.get(
                session__session_id=self.session_id,
                user_id=user_id
            )
            participant.is_active = False
            participant.save()
        except SessionParticipant.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_active_participant_count(self):
        """Get count of active participants - aligned with model property"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        active_count = session.participants.filter(is_active=True).count()
        print(f"🔢 Active participant count for session {self.session_id}: {active_count}")
        return active_count
    
    @database_sync_to_async
    def start_voting(self):
        """Start a voting session"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        session.voting_active = True
        session.voting_data = {}
        session.save()
    
    @database_sync_to_async
    def record_vote(self, vote):
        """Record a user's vote"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        voting_data = session.voting_data or {}
        voting_data[str(self.user.id)] = vote
        session.voting_data = voting_data
        session.save()
        return voting_data
    
    @database_sync_to_async
    def reset_voting(self):
        """Reset voting state"""
        session = CollaborationSession.objects.get(session_id=self.session_id)
        session.reset_voting()
        return True
    
    @database_sync_to_async
    def finalize_story(self):
        """Finalize and save the collaborative story"""
        from .models import Story
        from django.utils import timezone
        
        session = CollaborationSession.objects.get(session_id=self.session_id)
        
        # Get story draft data
        story_data = session.story_draft or {}
        
        # Create the main story record (without genres - ManyToManyField)
        story = Story.objects.create(
            title=story_data.get('title', 'Untitled Collaborative Story'),
            content=story_data.get('content', ''),
            canvas_data=story_data.get('canvas_data', '{}'),
            summary=story_data.get('summary', ''),
            category=story_data.get('category', 'other'),
            language=story_data.get('language', 'en'),
            cover_image=story_data.get('cover_image', ''),
            creation_type='collaborative',
            is_collaborative=True,
            collaboration_session=session,
            author=session.host,  # Primary author is the host
            is_published=False
        )
        
        # Set genres (JSONField - just a list) after creation
        genres_list = story_data.get('genres', [])
        if genres_list and isinstance(genres_list, list):
            # genres_list should be a list of genre strings like ['adventure', 'fantasy']
            story.genres = genres_list
            story.save(update_fields=['genres'])
        
        # Add all participants as co-authors
        participants = SessionParticipant.objects.filter(
            session=session,
            is_active=True
        ).select_related('user')
        
        for participant in participants:
            story.authors.add(participant.user)
        
        # Mark session as inactive
        session.is_active = False
        session.save()
        
        return {
            'story_id': story.id,
            'title': story.title
        }
