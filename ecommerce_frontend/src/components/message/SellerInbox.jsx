import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';
import { FiMessageSquare, FiArrowLeft, FiSend, FiAlertCircle, FiRefreshCw, FiUser } from 'react-icons/fi';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

const SellerInbox = () => {
  const { authTokens, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Fetch all conversations for the seller
  const fetchConversations = async () => {
    try {
      const response = await API.get('/messages/inbox/');
      setConversations(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await API.get(`/messages/${conversationId}/thread/`);
      setSelectedConversation(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
    }
  };

  // Send a reply
  const sendReply = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await API.post(
        `/messages/${selectedConversation.messages[0].id}/reply/`,
        {
          body: newMessage,
          subject: `Re: ${selectedConversation.messages[0].subject || 'Message'}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        }
      );

      // Update UI
      setMessages([...messages, response.data]);
      setNewMessage('');
      
      // Refresh conversation list
      await fetchConversations();
      
    } catch (error) {
      console.error('Reply error:', error.response?.data);
      setError(
        error.response?.data?.receiver?.[0] ||
        error.response?.data?.body?.[0] ||
        'Failed to send message'
      );
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="p-4 border-b bg-white">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
      </div>
      
      {/* Conversation List Skeleton */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error && !selectedConversation) return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4">
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold">Your Messages</h2>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg max-w-md">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 flex">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiRefreshCw className={`mr-1 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 h-screen flex flex-col">
      {!selectedConversation ? (
        // Conversation list view
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
          <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold">Your Messages</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Refresh conversations"
            >
              <FiRefreshCw className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <FiMessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500 text-center max-w-md">
                When you receive messages from buyers, they'll appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherUser = conversation.sender.id === user.user_id 
                  ? conversation.receiver 
                  : conversation.sender;
                const isUnread = !conversation.is_read && conversation.receiver.id === user.user_id;

                return (
                  <li 
                    key={conversation.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
                    onClick={() => fetchMessages(conversation.id)}
                  >
                    <div className="flex justify-between items-start sm:items-center">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {otherUser.avatar ? (
                            <img 
                              src={otherUser.avatar} 
                              alt={otherUser.username}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <FiUser className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline">
                            <h3 className="font-medium">
                              {otherUser.username}
                            </h3>
                            {isUnread && (
                              <span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-600 line-clamp-1">{conversation.subject}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{conversation.body}</p>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(conversation.timestamp)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        // Single conversation view
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
          <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center">
            <button 
              onClick={() => {
                setSelectedConversation(null);
                setError(null);
              }}
              className="mr-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to conversations"
            >
              <FiArrowLeft className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold truncate">
              Conversation with {selectedConversation.participant_names.find(name => name !== user.username)}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-2 rounded-lg">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.id === user.user_id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl rounded-lg p-3 ${
                      message.sender.id === user.user_id
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className={`font-medium ${message.sender.id === user.user_id ? 'text-blue-100' : 'text-gray-600'}`}>
                        {message.sender.username}
                      </span>
                      <span className={`ml-2 ${message.sender.id === user.user_id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </span>
                    </div>
                    {message.subject && message.subject !== selectedConversation.messages[0].subject && (
                      <div className="font-medium mb-1 text-sm">{message.subject}</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 border-t sticky bottom-0 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              />
              <button
                onClick={sendReply}
                disabled={!newMessage.trim()}
                className={`p-2 rounded-full flex items-center justify-center ${
                  newMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500'
                } transition-colors`}
                aria-label="Send message"
              >
                <FiSend className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerInbox;