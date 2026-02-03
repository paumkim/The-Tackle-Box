
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Contact, SignalType, SignalResponse, CrewMember } from '../types';
import { Phone, Mail, Users, Plus, ChevronRight, ArrowLeft, Building, PenTool, Search, Filter, Circle, Flag, CheckSquare, Users as UsersIcon, Check, X as XIcon, HelpCircle, UserPlus, FileText, Anchor, Coffee, Palmtree, BarChart3, Rocket, Radio, AlertOctagon } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export const TheReef: React.FC = () => {
  const contacts = useLiveQuery(() => db.contacts.toArray());
  const setActiveCall = useAppStore(state => state.setActiveCall);
  const hookedContactId = useAppStore(state => state.hookedContactId);
  const setHookedContactId = useAppStore(state => state.setHookedContactId);
  const localSearchEnabled = useAppStore(state => state.localSearchEnabled);
  const crewManifest = useAppStore(state => state.crewManifest);
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'CREW' | 'HQ' | 'CLIENT'>('ALL');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingLog, setPendingLog] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  const filteredContacts = useMemo(() => {
      if (!contacts) return [];
      return contacts.filter(c => {
          if (c.status === 'ONBOARDING') return false;
          if (filterType !== 'ALL' && c.category !== filterType) return false;
          if (filterType === 'CREW' && c.category === 'CREW' && c.status !== 'ACTIVE') return false; 
          if (showActiveOnly && c.status === 'ASHORE') return false;
          if (localSearchEnabled && searchQuery) {
              const q = searchQuery.toLowerCase();
              return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
          }
          return true;
      }).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, filterType, showActiveOnly, searchQuery, localSearchEnabled]);

  const onboardingContacts = useMemo(() => {
      if (!contacts) return [];
      return contacts.filter(c => c.status === 'ONBOARDING');
  }, [contacts]);

  const handleOpenDossier = (contact: Contact) => { setSelectedContact(contact); setPendingLog(contact.pendingItems || ''); };
  const handleCloseDossier = () => setSelectedContact(null);
  const handleSaveLog = async () => { if (!selectedContact?.id) return; setIsSavingLog(true); await db.contacts.update(selectedContact.id, { pendingItems: pendingLog }); setTimeout(() => setIsSavingLog(false), 500); };
  const handleCall = (contact: Contact) => { setActiveCall(contact); window.open(`tel:${contact.phone}`); };
  const handleEmail = (contact: Contact) => window.open(`mailto:${contact.email}`);
  const toggleHook = (e: React.MouseEvent, contact: Contact) => { e.stopPropagation(); setHookedContactId(hookedContactId === contact.id ? null : contact.id!); }
  const handleLaunch = async (e: React.MouseEvent, contact: Contact) => { e.stopPropagation(); if (contact.id) await db.contacts.update(contact.id, { status: 'ACTIVE' }); };
  const sendSignal = async (e: React.MouseEvent, contact: Contact, type: SignalType) => {
      e.stopPropagation(); if (!contact.id) return;
      await db.contacts.update(contact.id, { lastSignal: type, signalResponse: 'PENDING' });
      setTimeout(async () => { const response: SignalResponse = Math.random() > 0.3 ? 'AYE' : 'NAY'; await db.contacts.update(contact.id!, { signalResponse: response }); }, 1500);
  };

  const RiskDial: React.FC<{ contact: Contact }> = ({ contact }) => {
      const crewMember = crewManifest.find(cm => cm.name === contact.name);
      if (!crewMember) return null;
      const hoursSinceHeartbeat = (Date.now() - crewMember.lastHeartbeat) / (1000 * 60 * 60);
      let riskScore = 0; let isGhosting = false;
      if (crewMember.status === 'AT_OARS') { if (hoursSinceHeartbeat > 2) { riskScore += 60; isGhosting = true; } else riskScore += hoursSinceHeartbeat * 10; }
      if (crewMember.status === 'DRIFTING') riskScore += 40;
      if (riskScore < 10) return null;
      const color = isGhosting ? '#ef4444' : (riskScore > 50 ? '#f59e0b' : '#64748b');
      return (
          <div className="relative w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${Math.min(100, riskScore)}, 100`} /></svg>
              {isGhosting && <AlertOctagon className="w-2.5 h-2.5 text-red-500 absolute" />}
          </div>
      );
  }

  const LedgerRow: React.FC<{ contact: Contact }> = ({ contact }) => {
      const isActive = selectedContact?.id === contact.id; const isHooked = hookedContactId === contact.id; const isPending = contact.signalResponse === 'PENDING'; const signalsAllowed = contact.status === 'ACTIVE';
      const getSignalStatus = () => { if (!signalsAllowed) return null; if (contact.signalResponse === 'PENDING') return <div className="text-amber-500 font-bold text-[10px] flex items-center gap-1 animate-pulse"><Radio className="w-3 h-3" /> PENDING...</div>; if (contact.signalResponse === 'AYE') return <div className="text-emerald-600 flex items-center gap-1 font-bold text-[10px]"><Check className="w-3 h-3" /> AYE</div>; if (contact.signalResponse === 'NAY') return <div className="text-red-500 flex items-center gap-1 font-bold text-[10px]"><XIcon className="w-3 h-3" /> NAY</div>; return null; };
      const renderStatusDot = () => { if (contact.status === 'ACTIVE') return <div className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-600"></div>; if (contact.status === 'ASHORE' || contact.status === 'SHORE_LEAVE') return <div className="w-2 h-2 rounded-full border-2 border-slate-400"></div>; if (contact.status === 'GALLEY') return <Coffee className="w-3 h-3 text-orange-500" />; if (contact.status === 'ONBOARDING') return <div className="w-2 h-2 rounded-full bg-blue-400 border border-blue-500"></div>; return <div className="w-2 h-2 rounded-full bg-slate-300"></div>; };
      return (
        <div onClick={() => handleOpenDossier(contact)} className={`group flex items-center p-3 border-b border-slate-200 cursor-pointer transition-colors relative overflow-hidden ${isActive ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 z-10"></div>}
            {isPending && (<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 border-2 border-dashed border-amber-400/50 rounded-full animate-radar"></div></div>)}
            <div className="w-12 flex justify-center items-center shrink-0 z-10 gap-2">{renderStatusDot()}{contact.category === 'CREW' && <RiskDial contact={contact} />}</div>
            <div className="flex-1 grid grid-cols-12 gap-4 items-center z-10">
                <div className={`col-span-4 font-serif font-bold truncate flex items-center gap-2 ${isActive ? 'text-red-900' : 'text-slate-700'}`}>{contact.name}{isHooked && <Anchor className="w-3 h-3 text-amber-500" />}</div>
                <div className="col-span-4 text-sm text-slate-500 flex items-center gap-2 truncate font-mono"><span className="uppercase tracking-wide opacity-70 text-[10px]">{contact.role}</span><span className="text-slate-300">|</span><span className="font-serif italic text-slate-400">{contact.company}</span></div>
                <div className="col-span-4 flex justify-end gap-3 h-6 items-center"><div className={`transition-opacity duration-200 ${contact.signalResponse === 'PENDING' ? 'opacity-100' : 'group-hover:opacity-0 opacity-100'}`}>{getSignalStatus()}</div>
                    {signalsAllowed && (<div className="absolute right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 pl-2"><button onClick={(e) => sendSignal(e, contact, 'STATUS')} className="p-1 hover:bg-white hover:text-blue-600 text-slate-400 rounded border border-transparent hover:border-slate-200" title="Signal: Status?"><Flag className="w-3.5 h-3.5" /></button><button onClick={(e) => sendSignal(e, contact, 'READY')} className="p-1 hover:bg-white hover:text-emerald-600 text-slate-400 rounded border border-transparent hover:border-slate-200" title="Signal: Ready?"><CheckSquare className="w-3.5 h-3.5" /></button><button onClick={(e) => sendSignal(e, contact, 'SYNC')} className="p-1 hover:bg-white hover:text-amber-600 text-slate-400 rounded border border-transparent hover:border-slate-200" title="Signal: Sync?"><UsersIcon className="w-3.5 h-3.5" /></button></div>)}
                    <button onClick={(e) => toggleHook(e, contact)} className={`p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${isHooked ? 'text-amber-500 opacity-100 bg-amber-50' : 'text-slate-300 hover:text-amber-500'}`}><Anchor className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <div className="w-8 flex justify-center text-slate-300 z-10"><ChevronRight className="w-4 h-4" /></div>
        </div>
      );
  };

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
            <Users className="w-6 h-6 text-slate-600" />
            The Reef
          </h2>
          <p className="text-slate-500 font-serif italic text-sm">Personnel Ledger & Contact Manifest</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-sm font-bold text-xs uppercase tracking-wider hover:bg-slate-700 shadow-sm"><Plus className="w-4 h-4" /> Onboard Crew</button>
      </header>

      <div className="px-4 mb-4 flex items-center justify-between">
          <div className="flex bg-slate-200 p-1 rounded-lg gap-1">
              <button onClick={() => setFilterType('CREW')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'CREW' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>On Board</button>
              <button onClick={() => setFilterType('HQ')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'HQ' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Internal</button>
              <button onClick={() => setFilterType('CLIENT')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'CLIENT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>External</button>
              <button onClick={() => setFilterType('ALL')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => setShowActiveOnly(!showActiveOnly)} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md border transition-all ${showActiveOnly ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}><div className={`w-2 h-2 rounded-full ${showActiveOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>At the Oars</button>
              {localSearchEnabled && (<div className="relative"><Search className="w-4 h-4 absolute left-2 top-1.5 text-slate-400" /><input type="text" placeholder="Search Ledger..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 w-40" /></div>)}
          </div>
      </div>

      <div className="bridge-body-standard">
          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${selectedContact ? 'mr-[60%]' : ''}`}>
              {onboardingContacts.length > 0 && (<div className="mb-6 relative shrink-0"><div className="bg-[#3B4B5F]/90 text-slate-100 rounded-t-lg shadow-sm border border-slate-600 relative overflow-hidden mix-blend-multiply opacity-95"><div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div><div className="px-4 py-3 bg-[#2d3a4b]/50 border-b border-slate-500/30 flex items-center justify-between relative z-10"><div className="flex items-center gap-2"><Anchor className="w-4 h-4 text-slate-300" /><span className="text-xs font-bold uppercase tracking-widest text-slate-200">The Dry Dock (Onboarding)</span></div><span className="text-[10px] font-mono bg-slate-700/50 px-2 py-0.5 rounded text-slate-300 border border-slate-600">{onboardingContacts.length} PENDING</span></div><div className="divide-y divide-slate-600/30 relative z-10">{onboardingContacts.map(contact => (<div key={contact.id} onClick={() => handleOpenDossier(contact)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 group"><div className="flex items-center gap-3"><div className="bg-[#475569] text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-500">NEW</div><span className="font-mono font-bold text-slate-100 text-sm">{contact.name}</span><span className="text-xs text-slate-400 font-mono">{contact.role}</span></div><button onClick={(e) => handleLaunch(e, contact)} className="flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] hover:bg-white text-slate-800 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm opacity-0 group-hover:opacity-100"><Rocket className="w-3 h-3 text-[#3B4B5F]" /> Launch</button></div>))}</div></div><div className="h-2 bg-[#3B4B5F]/90 w-full mix-blend-multiply" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div></div>)}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden flex-1"><div className="flex items-center p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10"><div className="w-12 text-center">STS</div><div className="flex-1 grid grid-cols-12 gap-4"><div className="col-span-4">Crew Member</div><div className="col-span-4">Station</div><div className="col-span-4 text-right">Direct Signal</div></div><div className="w-8"></div></div><div className="flex-1 overflow-y-auto custom-scrollbar relative"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 pointer-events-none"></div>{filteredContacts.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-slate-400 font-serif italic"><p className="text-sm">Empty Reef</p></div>) : filteredContacts.map(contact => (<LedgerRow key={contact.id} contact={contact} />))}</div></div>
          </div>
          <AnimatePresence>{selectedContact && (<motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="absolute inset-y-0 right-4 w-[60%] bg-[#fdfbf7] border border-slate-300 rounded-r-lg shadow-2xl flex flex-col z-20 pb-6 mb-6"><div className="p-6 border-b border-slate-200 bg-white/50 flex items-start justify-between shrink-0"><div className="flex items-center gap-4"><button onClick={handleCloseDossier} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 mr-2"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-2xl font-serif font-bold text-slate-800">{selectedContact.name}</h2><div className="flex items-center gap-2 text-sm text-slate-500 font-mono mt-1"><span className="font-bold text-slate-700">{selectedContact.role}</span><span className="text-slate-300">at</span><span className="flex items-center gap-1"><Building className="w-3 h-3" /> {selectedContact.company}</span></div></div></div><div className="flex gap-2"><button onClick={() => handleCall(selectedContact)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:text-blue-600"><Phone className="w-3 h-3" /> Call</button><button onClick={() => handleEmail(selectedContact)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:text-blue-600"><Mail className="w-3 h-3" /> Email</button></div></div><div className="flex-1 overflow-hidden flex"><div className="w-1/2 p-6 border-r border-slate-200 overflow-y-auto custom-scrollbar space-y-8"><section><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">Vitals</h4><div className="space-y-3 text-sm font-serif"><div><label className="block text-[10px] text-slate-400 font-sans font-bold uppercase">Contact</label><div className="text-slate-700">{selectedContact.phone}</div><div className="text-slate-700">{selectedContact.email}</div></div></div></section><section><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 flex items-center gap-2"><BarChart3 className="w-3 h-3" /> Reliability</h4><div className="bg-slate-50 rounded p-3 border border-slate-200"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-slate-600">Response Rate</span><span className="text-lg font-bold font-mono">{selectedContact.reliability || 0}%</span></div><div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${selectedContact.reliability || 0}%` }}></div></div></div></section></div><div className="w-1/2 bg-white flex flex-col relative"><div className="absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div><div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center z-10"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><PenTool className="w-3 h-3" /> What I Need</span><span className={`text-[9px] font-mono text-slate-400 transition-opacity ${isSavingLog ? 'opacity-100' : 'opacity-0'}`}>SAVING...</span></div><textarea value={pendingLog} onChange={(e) => setPendingLog(e.target.value)} onBlur={handleSaveLog} className="flex-1 w-full resize-none outline-none font-serif text-slate-700 leading-[2rem] p-0 px-6 bg-transparent z-10 text-sm" style={{ backgroundImage: 'linear-gradient(transparent 31px, #e2e8f0 32px)', backgroundSize: '100% 32px', marginTop: '1rem' }} placeholder="Notes for this contact..." /></div></div></motion.div>)}</AnimatePresence>
      </div>
    </div>
  );
};
