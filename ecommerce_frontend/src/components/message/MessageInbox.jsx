import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';
import { FiMessageCircle, FiClock, FiUser, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';

const MessageInbox = () => {
  const { authTokens, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchConversations();
  }, [authTokens]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
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

  if (error) return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
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
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 self-start sm:self-auto"
        >
          <FiRefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FiMessageCircle className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            When you receive messages from seller, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
              const otherUser = conversation.sender.id === user.user_id 
                ? conversation.receiver 
                : conversation.sender;
              const isUnread = !conversation.is_read && conversation.receiver.id === user.user_id;

              return (
                <li key={conversation.id} className={isUnread ? 'bg-blue-50' : ''}>
                  <Link
                    to={`/messages/${conversation.id}`}
                    className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className={`text-sm font-medium truncate ${isUnread ? 'text-blue-800' : 'text-gray-900'}`}>
                            {otherUser.username}
                            {isUnread && (
                              <span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                            <FiClock className="mr-1 h-3 w-3 flex-shrink-0" />
                            {formatDate(conversation.timestamp)}
                          </span>
                        </div>
                        
                        {conversation.subject && (
                          <p className={`text-sm font-medium mt-1 truncate ${isUnread ? 'text-blue-700' : 'text-gray-800'}`}>
                            {conversation.subject}
                          </p>
                        )}
                        
                        <p className={`text-sm mt-1 truncate ${isUnread ? 'text-blue-600' : 'text-gray-500'}`}>
                          {conversation.body}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MessageInbox;