import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';
import { FiSend, FiArrowLeft, FiClock, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const MessageDetail = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { authTokens, user } = useContext(AuthContext);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/messages/${threadId}/thread/`);
      setThread(response.data);
      setMessages(response.data.messages);
      setError(null);
    } catch (error) {
      console.error('Error fetching thread:', error);
      setError('Failed to load conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      setSending(true);
      setError(null);
      const response = await API.post(
        `/messages/${threadId}/reply/`,
        {
          body: newMessage.trim(),
          subject: thread?.messages[0]?.subject || 'New message',
        },
        {
          headers: {
            Authorization: `Bearer ${authTokens.access}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg max-w-xs ${
                i % 2 === 0 ? 'ml-auto bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <div className="h-4 bg-gray-300 rounded w-24 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || 'Thread not found'}
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-sm underline"
          >
            Back to inbox
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = thread.participant_names.find(
    (name) => name !== user.username
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <FiUser className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {otherParticipant}
            </h2>
            <p className="text-sm text-gray-500">
              Subject: {messages[0]?.subject || 'No subject'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-6 max-h-[calc(100vh-300px)] overflow-y-auto p-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender.id === user.user_id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-4 ${
                msg.sender.id === user.user_id
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className={`font-medium ${msg.sender.id === user.user_id ? 'text-blue-100' : 'text-gray-600'}`}>
                  {msg.sender.username}
                </span>
                <span className={`ml-2 ${msg.sender.id === user.user_id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t pt-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-full flex items-center justify-center ${
              newMessage.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {sending ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <FiSend className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetail;