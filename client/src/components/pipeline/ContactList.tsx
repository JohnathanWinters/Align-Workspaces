import { Clock, CalendarDays, Users, Loader2 } from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";
import ContactRow from "./ContactRow";
import PipelineDailyFocus from "./PipelineDailyFocus";

interface ContactListProps {
  pipeline: UsePipelineReturn;
}

function ColumnHeader() {
  return (
    <div className="flex items-center px-4 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 select-none">
      <div className="w-8 shrink-0 mr-3" />
      <div className="flex-1 min-w-0 mr-3">Name</div>
      <div className="w-20 shrink-0 mr-2">Stage</div>
      <div className="w-6 shrink-0 mr-2 text-center">Asn</div>
      <div className="w-4 shrink-0 mr-2" />
      <div className="w-28 shrink-0 text-right">Status</div>
    </div>
  );
}

export default function ContactList({ pipeline }: ContactListProps) {
  const {
    loading, attentionContacts, upcomingContacts, restContacts,
    selectedContactId, focusedIndex, flatContactList,
    selectContact,
  } = pipeline;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const getFocusedId = () => focusedIndex >= 0 && focusedIndex < flatContactList.length
    ? flatContactList[focusedIndex].id : null;

  return (
    <div className="space-y-4 py-3" data-testid="pipeline-overview">
      {/* Daily Focus */}
      <PipelineDailyFocus pipeline={pipeline} />

      {/* Needs Attention */}
      {attentionContacts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5 px-4">
            <Clock className="w-3.5 h-3.5 text-red-500" /> Needs Attention
            <span className="text-gray-400 font-normal">({attentionContacts.length})</span>
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 mx-2 overflow-hidden">
            <ColumnHeader />
            <div className="divide-y divide-gray-100">
              {attentionContacts.map(c => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  variant="attention"
                  isSelected={selectedContactId === c.id}
                  isFocused={getFocusedId() === c.id}
                  onSelect={selectContact}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Follow-ups */}
      {upcomingContacts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5 px-4">
            <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Upcoming Follow-ups
            <span className="text-gray-400 font-normal">({upcomingContacts.length})</span>
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 mx-2 overflow-hidden">
            <ColumnHeader />
            <div className="divide-y divide-gray-100">
              {upcomingContacts.map(c => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  variant="upcoming"
                  isSelected={selectedContactId === c.id}
                  isFocused={getFocusedId() === c.id}
                  onSelect={selectContact}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Contacts */}
      {restContacts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5 px-4">
            <Users className="w-3.5 h-3.5 text-gray-400" /> Contacts
            <span className="text-gray-400 font-normal">({restContacts.length})</span>
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 mx-2 overflow-hidden">
            <ColumnHeader />
            <div className="divide-y divide-gray-100">
              {restContacts.map(c => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  variant="default"
                  isSelected={selectedContactId === c.id}
                  isFocused={getFocusedId() === c.id}
                  onSelect={selectContact}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {flatContactList.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No contacts match your filters.
        </div>
      )}
    </div>
  );
}
