import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEK_DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const TYPE_OPTIONS = [
  { key: 'event',   label: 'Event',   icon: '📅', color: '#2F6FED' },
  { key: 'task',    label: 'Task',    icon: '📝', color: '#28A745' },
  { key: 'holiday', label: 'Holiday', icon: '🎉', color: '#FFC107' },
];

const AUDIENCE_OPTIONS = [
  { key: 'whole_school', label: 'Whole School', icon: '🏫' },
  { key: 'class',        label: 'Class',        icon: '👩‍🏫' },
  { key: 'student',      label: 'Student',      icon: '👤' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getTypeInfo = (type: string) =>
  TYPE_OPTIONS.find(t => t.key === type) ?? TYPE_OPTIONS[0];

// ─── Time Picker ─────────────────────────────────────────────────────────────
const TimePicker = ({
  hour, minute,
  onChange,
}: { hour: number; minute: number; onChange: (h: number, m: number) => void }) => {
  const ampm    = hour >= 12 ? 'PM' : 'AM';
  const h12     = hour % 12 === 0 ? 12 : hour % 12;
  return (
    <View style={tp.wrap}>
      <Text style={tp.label}>Time</Text>
      <View style={tp.row}>
        <View style={tp.col}>
          <TouchableOpacity onPress={() => onChange((hour + 1) % 24, minute)} style={tp.btn}><Text style={tp.arrow}>▲</Text></TouchableOpacity>
          <Text style={tp.val}>{String(h12).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => onChange((hour + 23) % 24, minute)} style={tp.btn}><Text style={tp.arrow}>▼</Text></TouchableOpacity>
        </View>
        <Text style={tp.colon}>:</Text>
        <View style={tp.col}>
          <TouchableOpacity onPress={() => onChange(hour, (minute + 5) % 60)} style={tp.btn}><Text style={tp.arrow}>▲</Text></TouchableOpacity>
          <Text style={tp.val}>{String(minute).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => onChange(hour, (minute + 55) % 60)} style={tp.btn}><Text style={tp.arrow}>▼</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onChange((hour + 12) % 24, minute)} style={tp.ampmBtn}>
          <Text style={tp.ampmTxt}>{ampm}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const tp = StyleSheet.create({
  wrap:    { marginBottom: 16 },
  label:   { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  col:     { alignItems: 'center', minWidth: 48 },
  btn:     { padding: 6 },
  arrow:   { fontSize: 16, color: '#2F6FED', fontWeight: 'bold' },
  val:     { fontSize: 28, fontWeight: '700', color: '#333', width: 48, textAlign: 'center' },
  colon:   { fontSize: 28, fontWeight: '700', color: '#333', marginHorizontal: 4 },
  ampmBtn: { marginLeft: 12, backgroundColor: '#2F6FED', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  ampmTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AcademicEventsScreen = () => {
  const { user } = useAuth();
  const { events, students, addEvent, updateEvent, removeEvent } = useData();

  // Calendar state
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));

  // Filter / modal state
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [modalVisible,   setModalVisible]   = useState(false);
  const [editingEvent,   setEditingEvent]   = useState<any>(null);

  // Form state
  const [title,       setTitle]       = useState('');
  const [formDate,    setFormDate]    = useState('');
  const [hour,        setHour]        = useState(9);
  const [minute,      setMinute]      = useState(0);
  const [eventType,   setEventType]   = useState('event');
  const [audience,    setAudience]    = useState('whole_school');
  const [description, setDescription] = useState('');
  const [notifyParents, setNotifyParents] = useState(false);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const firstDow    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toDateStr(today);

  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0),  setCalYear(y => y + 1)) : setCalMonth(m => m + 1);

  const getEventsForDate = (dateStr: string) =>
    events.filter(e => e.date.startsWith(dateStr));

  const getDotColors = (dateStr: string) => {
    const evs = getEventsForDate(dateStr);
    return [...new Set(evs.map(e => getTypeInfo(e.type).color))].slice(0, 3);
  };

  // ── Filtered list for selected date ────────────────────────────────────────
  const visibleEvents = events
    .filter(e => {
      const matchDate = e.date.startsWith(selectedDate);
      const matchType = typeFilter === 'all' || e.type === typeFilter;
      const matchAud  =
        audienceFilter === 'all' ||
        (audienceFilter === 'whole_school' && !e.studentId && !e.classId) ||
        (audienceFilter === 'class'        && e.classId) ||
        (audienceFilter === 'student'      && e.studentId);
      return matchDate && matchType && matchAud;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openCreate = (date?: string) => {
    setEditingEvent(null);
    setTitle(''); setFormDate(date ?? selectedDate);
    setHour(9); setMinute(0);
    setEventType('event'); setAudience('whole_school');
    setDescription(''); setNotifyParents(false);
    setModalVisible(true);
  };

  const openEdit = (ev: any) => {
    const d = new Date(ev.date);
    setEditingEvent(ev);
    setTitle(ev.title); setFormDate(ev.date.split('T')[0]);
    setHour(d.getHours()); setMinute(d.getMinutes());
    setEventType(ev.type);
    setAudience(ev.studentId ? 'student' : ev.classId ? 'class' : 'whole_school');
    setDescription(ev.notes); setNotifyParents(false);
    setModalVisible(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter an event title'); return; }
    if (!formDate)     { Alert.alert('Required', 'Please select a date'); return; }

    const [y, m, d] = formDate.split('-').map(Number);
    const eventDate = new Date(y, m - 1, d, hour, minute, 0);

    const data: any = {
      id:        editingEvent ? editingEvent.id : `event_${Date.now()}`,
      title:     title.trim(),
      date:      eventDate.toISOString(),
      type:      eventType,
      notes:     description,
      createdBy: (user as any)?.id || 'admin',
      ...(audience === 'class'   && { classId:   'class_1' }),
      ...(audience === 'student' && { studentId: students[0]?.id || 's_1' }),
    };

    if (editingEvent) updateEvent(editingEvent.id, data);
    else addEvent(data);

    Alert.alert('Success', `Event ${editingEvent ? 'updated' : 'created'}!`);
    setModalVisible(false);
  };

  const handleDelete = (ev: any) => {
    Alert.alert('Delete Event', `Delete "${ev.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEvent(ev.id) },
    ]);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatFullDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>🏫 Kilbil School</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {(user as any)?.name?.split(' ')[0]}!</Text>
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatarCircle}>
              <Text style={styles.adminAvatarInitials}>
                {(user as any)?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'A'}
              </Text>
            </View>
            <View>
              <Text style={styles.adminName}>{(user as any)?.name}</Text>
              <Text style={styles.adminRole}>School Administrator</Text>
            </View>
          </View>
        </View>

        {/* ── Full Calendar ── */}
        <View style={styles.calCard}>
          {/* Month navigation */}
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNav}>
              <Text style={styles.calNavTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>
              {MONTH_NAMES[calMonth]} {calYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calNav}>
              <Text style={styles.calNavTxt}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.calRow}>
            {WEEK_DAYS.map(d => (
              <Text key={d} style={styles.calDayLbl}>{d}</Text>
            ))}
          </View>

          {/* Date cells */}
          {Array.from({ length: cells.length / 7 }, (_, wi) => (
            <View key={wi} style={styles.calRow}>
              {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                const ds      = day ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                const isSel   = ds === selectedDate;
                const isToday = ds === todayStr;
                const dots    = day ? getDotColors(ds) : [];
                return (
                  <TouchableOpacity
                    key={di}
                    style={[styles.calCell, isSel && styles.calCellSel, isToday && !isSel && styles.calCellToday]}
                    onPress={() => day && setSelectedDate(ds)}
                    disabled={!day}
                  >
                    <Text style={[styles.calCellTxt, isSel && styles.calCellTxtSel, isToday && !isSel && styles.calCellTxtToday, !day && { color: 'transparent' }]}>
                      {day || ''}
                    </Text>
                    {dots.length > 0 && (
                      <View style={styles.dotsRow}>
                        {dots.map((c, i) => (
                          <View key={i} style={[styles.dot, { backgroundColor: isSel ? '#fff' : c }]} />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected date bar */}
        <View style={styles.selectedBar}>
          <Text style={styles.selectedBarTxt}>📅 {formatFullDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.addDateBtn} onPress={() => openCreate(selectedDate)}>
            <Text style={styles.addDateBtnTxt}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.filterLbl}>Type:</Text>
            {[{ key: 'all', label: 'All', icon: '' }, ...TYPE_OPTIONS].map(f => (
              <TouchableOpacity key={f.key}
                style={[styles.filterPill, typeFilter === f.key && styles.filterPillActive]}
                onPress={() => setTypeFilter(f.key)}>
                <Text style={[styles.filterPillTxt, typeFilter === f.key && styles.filterPillTxtActive]}>
                  {f.icon ? `${f.icon} ` : ''}{f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <Text style={styles.filterLbl}>For:</Text>
            {[{ key: 'all', label: 'All', icon: '' }, ...AUDIENCE_OPTIONS].map(f => (
              <TouchableOpacity key={f.key}
                style={[styles.filterPill, audienceFilter === f.key && styles.filterPillActive]}
                onPress={() => setAudienceFilter(f.key)}>
                <Text style={[styles.filterPillTxt, audienceFilter === f.key && styles.filterPillTxtActive]}>
                  {f.icon ? `${f.icon} ` : ''}{f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Events for selected date */}
        <View style={styles.eventsWrap}>
          <Text style={styles.eventsTitle}>
            Events ({visibleEvents.length})
          </Text>

          {visibleEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No events on this day</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openCreate(selectedDate)}>
                <Text style={styles.emptyAddTxt}>+ Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            visibleEvents.map(ev => {
              const info = getTypeInfo(ev.type);
              return (
                <View key={ev.id} style={[styles.eventCard, { borderLeftColor: info.color }]}>
                  <View style={styles.eventCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <Text style={styles.eventTime}>{info.icon} {formatTime(ev.date)}</Text>
                      {ev.notes ? <Text style={styles.eventNotes}>{ev.notes}</Text> : null}
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: info.color }]}>
                      <Text style={styles.typeBadgeTxt}>{info.label}</Text>
                    </View>
                  </View>
                  <View style={styles.eventActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(ev)}>
                      <Text style={styles.editBtnTxt}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(ev)}>
                      <Text style={styles.deleteBtnTxt}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Global Create Button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => openCreate()}>
          <Text style={styles.createBtnTxt}>+ Create Event</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Create / Edit Modal ── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEvent ? '✏️ Edit Event' : '➕ Create Event'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Title */}
              <Text style={styles.fieldLbl}>Event Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="e.g. Annual Sports Day"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#aaa"
              />

              {/* Inline mini-calendar for date */}
              <Text style={styles.fieldLbl}>Date *</Text>
              <MiniCalendar selectedDate={formDate} onSelect={setFormDate} />
              {formDate ? (
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeTxt}>
                    📅 {new Date(formDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              ) : null}

              {/* Time */}
              <TimePicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />

              {/* Type */}
              <Text style={styles.fieldLbl}>Type</Text>
              <View style={styles.pillRow}>
                {TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.key}
                    style={[styles.pill, eventType === opt.key && { backgroundColor: opt.color, borderColor: opt.color }]}
                    onPress={() => setEventType(opt.key)}>
                    <Text style={styles.pillIcon}>{opt.icon}</Text>
                    <Text style={[styles.pillTxt, eventType === opt.key && styles.pillTxtActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Audience */}
              <Text style={styles.fieldLbl}>Audience</Text>
              <View style={styles.pillRow}>
                {AUDIENCE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.key}
                    style={[styles.pill, audience === opt.key && styles.pillActive]}
                    onPress={() => setAudience(opt.key)}>
                    <Text style={styles.pillIcon}>{opt.icon}</Text>
                    <Text style={[styles.pillTxt, audience === opt.key && styles.pillTxtActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.fieldLbl}>Description</Text>
              <TextInput
                style={styles.descInput}
                placeholder="Add details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#aaa"
                textAlignVertical="top"
              />

              {/* Notify parents */}
              <TouchableOpacity style={styles.notifyRow} onPress={() => setNotifyParents(v => !v)}>
                <View style={[styles.checkbox, notifyParents && styles.checkboxOn]}>
                  {notifyParents && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.notifyTxt}>Notify Parents</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnTxt}>{editingEvent ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Mini Calendar (inside modal) ─────────────────────────────────────────────
const MiniCalendar = ({
  selectedDate, onSelect,
}: { selectedDate: string; onSelect: (d: string) => void }) => {
  const today = new Date();
  const init  = selectedDate ? new Date(selectedDate + 'T12:00:00') : today;
  const [yr, setYr] = useState(init.getFullYear());
  const [mo, setMo] = useState(init.getMonth());

  const firstDow    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayStr = toDateStr(today);

  return (
    <View style={mc.wrap}>
      <View style={mc.header}>
        <TouchableOpacity onPress={() => mo === 0 ? (setMo(11), setYr(y => y-1)) : setMo(m => m-1)} style={mc.nav}>
          <Text style={mc.navTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={mc.month}>{MONTH_NAMES[mo]} {yr}</Text>
        <TouchableOpacity onPress={() => mo === 11 ? (setMo(0), setYr(y => y+1)) : setMo(m => m+1)} style={mc.nav}>
          <Text style={mc.navTxt}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={mc.row}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={mc.dayLbl}>{d}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} style={mc.row}>
          {cells.slice(wi*7, wi*7+7).map((day, di) => {
            const ds = day ? `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
            const isSel   = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <TouchableOpacity key={di} style={[mc.cell, isSel && mc.selCell, isToday && !isSel && mc.todayCell]}
                onPress={() => day && onSelect(ds)} disabled={!day}>
                <Text style={[mc.cellTxt, isSel && mc.selTxt, isToday && !isSel && mc.todayTxt, !day && { color: 'transparent' }]}>
                  {day || ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};
const mc = StyleSheet.create({
  wrap:     { backgroundColor: '#f0f4ff', borderRadius: 12, padding: 10, marginBottom: 10 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nav:      { padding: 6 },
  navTxt:   { fontSize: 22, color: '#2F6FED', fontWeight: 'bold' },
  month:    { fontSize: 15, fontWeight: '700', color: '#333' },
  row:      { flexDirection: 'row' },
  dayLbl:   { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#888', paddingVertical: 3 },
  cell:     { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20, margin: 1 },
  cellTxt:  { fontSize: 12, color: '#333' },
  selCell:  { backgroundColor: '#2F6FED' },
  selTxt:   { color: '#fff', fontWeight: '700' },
  todayCell:{ borderWidth: 1.5, borderColor: '#2F6FED' },
  todayTxt: { color: '#2F6FED', fontWeight: '700' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },

  // header
  header: { backgroundColor: '#2F6FED', paddingTop: 44, paddingBottom: 24, paddingHorizontal: 20, marginBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 24, fontWeight: '700', color: '#fff' },
  welcomeText: { fontSize: 15, fontWeight: '600', color: '#B3D4FF' },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  adminAvatarInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  adminName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  adminRole: { fontSize: 13, color: '#B3D4FF', fontWeight: '500' },

  // calendar card
  calCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNav: { padding: 8 },
  calNavTxt: { fontSize: 26, color: '#2F6FED', fontWeight: 'bold' },
  calMonthLabel: { fontSize: 18, fontWeight: '800', color: '#222' },
  calRow: { flexDirection: 'row' },
  calDayLbl: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#999', paddingVertical: 6 },
  calCell: { flex: 1, aspectRatio: 0.9, justifyContent: 'center', alignItems: 'center', borderRadius: 10, margin: 2 },
  calCellTxt: { fontSize: 14, color: '#333', fontWeight: '500' },
  calCellSel: { backgroundColor: '#2F6FED' },
  calCellTxtSel: { color: '#fff', fontWeight: '800' },
  calCellToday: { borderWidth: 2, borderColor: '#2F6FED' },
  calCellTxtToday: { color: '#2F6FED', fontWeight: '800' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  // selected date bar
  selectedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2F6FED', marginHorizontal: 16, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12 },
  selectedBarTxt: { fontSize: 13, color: '#fff', fontWeight: '600', flex: 1 },
  addDateBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addDateBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // filters
  filtersWrap: { paddingHorizontal: 16, marginBottom: 12 },
  filterLbl: { fontSize: 13, fontWeight: '700', color: '#555', marginRight: 8, alignSelf: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dee2e6', marginRight: 8 },
  filterPillActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  filterPillTxt: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterPillTxtActive: { color: '#fff', fontWeight: '700' },

  // events list
  eventsWrap: { paddingHorizontal: 16, marginBottom: 16 },
  eventsTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 12 },
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 3 },
  eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  eventTime: { fontSize: 13, color: '#666', marginBottom: 2 },
  eventNotes: { fontSize: 12, color: '#999' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  eventActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#2F6FED', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  editBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#DC3545', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  deleteBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // empty
  emptyState: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: '#666', marginBottom: 16 },
  emptyAddBtn: { backgroundColor: '#2F6FED', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyAddTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // global create button
  createBtn: { backgroundColor: '#2F6FED', marginHorizontal: 16, marginBottom: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  createBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '95%', paddingBottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  modalCloseTxt: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  fieldLbl: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 4, marginHorizontal: 20 },
  titleInput: { backgroundColor: '#f8f9fa', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0', color: '#333', marginBottom: 16, marginHorizontal: 20 },
  dateBadge: { backgroundColor: '#e8f0fe', padding: 10, borderRadius: 8, marginBottom: 16, marginHorizontal: 20 },
  dateBadgeTxt: { fontSize: 13, color: '#2F6FED', fontWeight: '600', textAlign: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#e0e0e0', gap: 5 },
  pillActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  pillIcon: { fontSize: 14 },
  pillTxt: { fontSize: 13, fontWeight: '600', color: '#555' },
  pillTxtActive: { color: '#fff' },
  descInput: { backgroundColor: '#f8f9fa', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 15, borderWidth: 1, borderColor: '#e0e0e0', color: '#333', minHeight: 80, marginBottom: 16, marginHorizontal: 20 },
  notifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#ccc', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxOn: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  notifyTxt: { fontSize: 15, color: '#333', fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelBtnTxt: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#2F6FED', alignItems: 'center' },
  saveBtnTxt: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default AcademicEventsScreen;
