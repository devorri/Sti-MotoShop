import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase';

type Conversation = { id: string; customer_id: string; customer_name: string; updated_at: string };
type ChatMessage = { id: string; conversation_id: string; sender_id: string; sender_name: string; sender_role: string; body: string; created_at: string; read_at: string | null };

export const Chat: React.FC<{ admin?: boolean }> = ({ admin = false }) => {
  const { currentUser } = useAppContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedConversation = useMemo(() => conversations.find(conversation => conversation.id === selectedId), [conversations, selectedId]);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    let query = supabase.from('chat_conversations').select('*').order('updated_at', { ascending: false });
    if (!admin) query = query.eq('customer_id', currentUser.id);
    const { data, error } = await query;
    if (!error) {
      const rows = (data || []) as Conversation[];
      setConversations(rows);
      setSelectedId(previous => previous || rows[0]?.id || '');
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!selectedId) { setMessages([]); return; }
    const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', selectedId).order('created_at');
    setMessages((data || []) as ChatMessage[]);
  };

  useEffect(() => { load(); }, [currentUser?.id, admin]);
  useEffect(() => { loadMessages(); }, [selectedId]);
  useEffect(() => {
    const channel = supabase.channel(`chat-${admin ? 'admin' : currentUser?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => { load(); loadMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId, admin, currentUser?.id]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !currentUser) return;
    let conversationId = selectedId;
    if (!conversationId) {
      const { data, error } = await supabase.from('chat_conversations').insert([{ customer_id: currentUser.id, customer_name: currentUser.name }]).select().single();
      if (error || !data) return;
      conversationId = data.id;
      setSelectedId(conversationId);
    }
    const { error } = await supabase.from('chat_messages').insert([{ conversation_id: conversationId, sender_id: currentUser.id, sender_name: currentUser.name, sender_role: currentUser.role, body }]);
    if (!error) { setDraft(''); await load(); await loadMessages(); }
  };

  return <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}><MessageCircle color="#2563eb" /><div><h2 style={{ margin: 0 }}>{admin ? 'Customer Chat Inbox' : 'Chat with Admin'}</h2><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{admin ? 'Reply to rider club members in real time.' : 'Ask about your orders, parts, or services.'}</p></div><button className="btn" style={{ marginLeft: 'auto' }} onClick={load} title="Refresh"><RefreshCw size={16} /></button></div>
    <div className="card" style={{ display: 'grid', gridTemplateColumns: admin ? '280px minmax(0, 1fr)' : 'minmax(0, 1fr)', minHeight: '560px', padding: 0, overflow: 'hidden' }}>
      {admin && <aside style={{ borderRight: '1px solid #e2e8f0', padding: '12px', background: '#f8fafc' }}>{loading ? 'Loading chats...' : conversations.length ? conversations.map(conversation => <button key={conversation.id} className="btn" onClick={() => setSelectedId(conversation.id)} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px', background: selectedId === conversation.id ? '#dbeafe' : '#fff' }}><span>{conversation.customer_name}</span></button>) : <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No customer chats yet.</p>}</aside>}
      <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{admin ? selectedConversation?.customer_name || 'Select a conversation' : 'Boss Rap Support'}</div>
        <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '430px' }}>{messages.length ? messages.map(message => { const mine = message.sender_id === currentUser?.id; return <div key={message.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '76%', background: mine ? '#2563eb' : '#e2e8f0', color: mine ? '#fff' : '#0f172a', borderRadius: '12px', padding: '9px 12px' }}><div style={{ fontSize: '0.69rem', opacity: .78, marginBottom: '3px' }}>{mine ? 'You' : message.sender_name}</div><div style={{ whiteSpace: 'pre-wrap' }}>{message.body}</div><div style={{ fontSize: '0.64rem', opacity: .7, marginTop: '4px' }}>{new Date(message.created_at).toLocaleString()}</div></div>; }) : <p style={{ color: '#64748b', textAlign: 'center', margin: 'auto' }}>{admin && !selectedId ? 'Choose a customer to reply.' : 'Start the conversation — the store team will reply here.'}</p>}</div>
        <form onSubmit={send} style={{ display: 'flex', gap: '10px', padding: '14px', borderTop: '1px solid #e2e8f0' }}><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Type a message..." maxLength={2000} disabled={admin && !selectedId} /><button className="btn-primary" disabled={!draft.trim() || (admin && !selectedId)}><Send size={16} /> Send</button></form>
      </section>
    </div>
  </div>;
};
