import { useState, useMemo } from "react";
import type { UserRole } from "@/lib/data";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Pencil,
  Plus,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  Network,
  Users,
  ClipboardList,
  Link2,
  Info,
  Trash2,
  Camera,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type OnDutyStatus = "On Duty" | "Off Duty" | "On Call" | "On Leave";

interface Contact {
  id: string;
  position: string;
  name: string;
  base: string;
  phone: string;
  email: string;
  onDutyStatus: OnDutyStatus;
  isCurrent: boolean;
}

type RoleType = "aviation" | "medical" | "engineering" | "management";

interface OrgNode {
  id: string;
  title: string;
  roleType: RoleType;
  count?: number;
  children?: OrgNode[];
}

interface Props {
  role: UserRole;
}

/* ------------------------------------------------------------------ */
/* Static data                                                        */
/* ------------------------------------------------------------------ */

const BASES = ["Dubbo", "Broken Hill", "Bankstown", "Launceston", "Essendon", "Corporate"] as const;

const INITIAL_CONTACTS: Contact[] = [
  { id: "C001", position: "Director of Aviation Operations", name: "Malcolm Fairweather", base: "Corporate", phone: "0428 110 220", email: "m.fairweather@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C002", position: "Base Manager — Dubbo", name: "Rachel Hendricks", base: "Dubbo", phone: "0412 334 556", email: "r.hendricks@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C003", position: "Base Manager — Broken Hill", name: "Grant Osborne", base: "Broken Hill", phone: "0417 662 998", email: "g.osborne@rfds.org.au", onDutyStatus: "On Call", isCurrent: true },
  { id: "C004", position: "Base Manager — Bankstown", name: "Priya Chandrasekaran", base: "Bankstown", phone: "0409 774 112", email: "p.chandrasekaran@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C005", position: "Base Manager — Launceston", name: "Declan O'Meara", base: "Launceston", phone: "0433 220 887", email: "d.omeara@rfds.org.au", onDutyStatus: "Off Duty", isCurrent: true },
  { id: "C006", position: "Base Manager — Essendon", name: "Fiona Marsh", base: "Essendon", phone: "0421 556 340", email: "f.marsh@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C007", position: "Captain / PIC", name: "Robert Hughes", base: "Dubbo", phone: "0405 118 664", email: "r.hughes@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C008", position: "Captain / PIC", name: "Tobias Barnes", base: "Broken Hill", phone: "0402 887 213", email: "t.barnes@rfds.org.au", onDutyStatus: "On Call", isCurrent: true },
  { id: "C009", position: "First Officer", name: "Michael Clarke", base: "Dubbo", phone: "0419 552 771", email: "m.clarke@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C010", position: "Retrieval Nurse", name: "Sarah Mitchell", base: "Dubbo", phone: "0438 664 902", email: "s.mitchell@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C011", position: "Chief Pilot", name: "Warren Ashcroft", base: "Corporate", phone: "0407 221 998", email: "w.ashcroft@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C012", position: "Check & Training Captain", name: "Deborah Sun", base: "Corporate", phone: "0413 774 559", email: "d.sun@rfds.org.au", onDutyStatus: "Off Duty", isCurrent: true },
  { id: "C013", position: "Director of Medical Services", name: "Dr. Kavita Patel", base: "Corporate", phone: "0411 998 220", email: "k.patel@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C014", position: "Senior Retrieval Nurse", name: "Jacinta O'Brien", base: "Broken Hill", phone: "0420 336 771", email: "j.obrien@rfds.org.au", onDutyStatus: "On Call", isCurrent: true },
  { id: "C015", position: "Retrieval Physician", name: "Dr. Samuel Ngata", base: "Bankstown", phone: "0431 662 004", email: "s.ngata@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C016", position: "Director of Engineering", name: "Colin Whitfield", base: "Corporate", phone: "0448 220 115", email: "c.whitfield@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C017", position: "Licensed Aircraft Maintenance Engineer", name: "Daniel Evans", base: "Dubbo", phone: "0402 771 336", email: "d.evans@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C018", position: "General Manager — Operations", name: "Melissa Johnson", base: "Corporate", phone: "0417 552 009", email: "m.johnson@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C019", position: "Dispatch / ACC", name: "Trent Walsh", base: "Corporate", phone: "0409 118 774", email: "t.walsh@rfds.org.au", onDutyStatus: "On Duty", isCurrent: true },
  { id: "C020", position: "Safety Officer", name: "Amrita Singh", base: "Corporate", phone: "0422 664 331", email: "a.singh@rfds.org.au", onDutyStatus: "Off Duty", isCurrent: true },
];

const ORG_TREE: OrgNode = {
  id: "director-aviation",
  title: "Director of Aviation Operations",
  roleType: "management",
  children: [
    {
      id: "bm-dubbo",
      title: "Base Manager — Dubbo",
      roleType: "management",
      children: [
        { id: "captain-dubbo", title: "Captain / PIC", roleType: "aviation", count: 2 },
        { id: "fo-dubbo", title: "First Officer", roleType: "aviation", count: 2 },
        { id: "nurse-dubbo", title: "Retrieval Nurse", roleType: "medical", count: 2 },
      ],
    },
    {
      id: "bm-brokenhill",
      title: "Base Manager — Broken Hill",
      roleType: "management",
      children: [
        { id: "captain-bh", title: "Captain / PIC", roleType: "aviation", count: 2 },
        { id: "fo-bh", title: "First Officer", roleType: "aviation", count: 1 },
      ],
    },
    {
      id: "bm-bankstown",
      title: "Base Manager — Bankstown",
      roleType: "management",
      children: [
        { id: "captain-bk", title: "Captain / PIC", roleType: "aviation", count: 2 },
        { id: "fo-bk", title: "First Officer", roleType: "aviation", count: 2 },
      ],
    },
    {
      id: "bm-launceston",
      title: "Base Manager — Launceston",
      roleType: "management",
      children: [
        { id: "captain-lst", title: "Captain / PIC", roleType: "aviation", count: 1 },
        { id: "fo-lst", title: "First Officer", roleType: "aviation", count: 1 },
      ],
    },
    {
      id: "bm-essendon",
      title: "Base Manager — Essendon",
      roleType: "management",
      children: [
        { id: "captain-ess", title: "Captain / PIC", roleType: "aviation", count: 1 },
        { id: "fo-ess", title: "First Officer", roleType: "aviation", count: 1 },
      ],
    },
    {
      id: "chief-pilot",
      title: "Chief Pilot",
      roleType: "aviation",
      children: [{ id: "check-training", title: "Check & Training Captain", roleType: "aviation" }],
    },
    {
      id: "director-medical",
      title: "Director of Medical Services",
      roleType: "medical",
      children: [
        { id: "senior-nurse", title: "Senior Retrieval Nurse", roleType: "medical" },
        { id: "retrieval-physician", title: "Retrieval Physician", roleType: "medical" },
      ],
    },
    {
      id: "director-engineering",
      title: "Director of Engineering",
      roleType: "engineering",
      children: [{ id: "lame", title: "Licensed Aircraft Maintenance Engineer", roleType: "engineering", count: 2 }],
    },
    {
      id: "gm-ops",
      title: "General Manager — Operations",
      roleType: "management",
      children: [
        { id: "dispatch-acc", title: "Dispatch / ACC", roleType: "management" },
        { id: "safety-officer", title: "Safety Officer", roleType: "management" },
      ],
    },
  ],
};

const ROLE_TYPE_STYLES: Record<RoleType, { border: string; text: string; dot: string }> = {
  aviation: { border: "border-l-[#4F98A3]", text: "text-[#4F98A3]", dot: "bg-[#4F98A3]" },
  medical: { border: "border-l-purple-400", text: "text-purple-400", dot: "bg-purple-400" },
  engineering: { border: "border-l-orange-400", text: "text-orange-400", dot: "bg-orange-400" },
  management: { border: "border-l-green-400", text: "text-green-400", dot: "bg-green-400" },
};

const STATUS_STYLES: Record<OnDutyStatus, string> = {
  "On Duty": "bg-green-400/10 text-green-400 border-green-400/30",
  "Off Duty": "bg-[#5A5957]/10 text-[#797876] border-[#393836]",
  "On Call": "bg-amber-400/10 text-amber-400 border-amber-400/30",
  "On Leave": "bg-red-400/10 text-red-400 border-red-400/30",
};

const canEdit = (role: UserRole) => role === "admin" || role === "senior_management";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Org chart node lookup helper — first matching contact for a title  */
/* ------------------------------------------------------------------ */

function findContactByPosition(contacts: Contact[], positionTitle: string): Contact | undefined {
  return contacts.find((c) => c.isCurrent && c.position.toLowerCase() === positionTitle.toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Tab 1 — Organisation Chart                                         */
/* ------------------------------------------------------------------ */

function OrgNodeCard({
  node,
  contacts,
  expanded,
  toggle,
  depth,
  onSelectContact,
}: {
  node: OrgNode;
  contacts: Contact[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  depth: number;
  onSelectContact: (contact: Contact | null, node: OrgNode) => void;
}) {
  const styles = ROLE_TYPE_STYLES[node.roleType];
  const contact = findContactByPosition(contacts, node.title);
  const hasChildren = !!node.children?.length;
  const isOpen = expanded[node.id] !== false; // default open

  function handleCardClick() {
    if (contact) {
      onSelectContact(contact, node);
    } else if (hasChildren) {
      toggle(node.id);
    } else {
      // Leaf node with a vacant position — open an empty "Vacant" card.
      onSelectContact(null, node);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleCardClick}
        className={`group relative w-52 rounded-lg border border-[#393836] ${styles.border} border-l-4 bg-[#1C1B19] px-3 py-2.5 text-left shadow-sm transition-colors hover:border-[#4F98A3]/50 cursor-pointer`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className="text-xs font-bold text-[#CDCCCA] leading-tight"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              {node.title}
              {node.count && node.count > 1 ? (
                <span className="ml-1 text-[10px] font-medium text-[#797876]">(×{node.count})</span>
              ) : null}
            </div>
          </div>
          {hasChildren && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                toggle(node.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  toggle(node.id);
                }
              }}
              className="text-[#797876] shrink-0 mt-0.5 p-0.5 rounded-md hover:bg-[#171614] hover:text-[#4F98A3] transition-colors cursor-pointer"
              title={isOpen ? "Collapse reports" : "Expand reports"}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>

        {contact ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#01696F]/20 border border-[#4F98A3]/30 flex items-center justify-center text-[10px] font-bold text-[#4F98A3] shrink-0">
              {initials(contact.name)}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#CDCCCA] truncate">{contact.name}</div>
              <div className="text-[10px] text-[#5A5957] truncate">{contact.base}</div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[10px] text-[#5A5957] italic">Position vacant</div>
        )}
      </button>

      {hasChildren && isOpen && (
        <>
          <div className="w-px h-4 bg-[#393836]" />
          <div className="relative flex flex-wrap justify-center gap-x-4 gap-y-4">
            {node.children!.length > 1 && (
              <div
                className="absolute -top-4 left-0 right-0 h-px bg-[#393836]"
                style={{ marginLeft: "calc(13rem / 2)", marginRight: "calc(13rem / 2)" }}
              />
            )}
            {node.children!.map((child) => (
              <div key={child.id} className="flex flex-col items-center pt-0">
                <div className="w-px h-4 bg-[#393836]" />
                <OrgNodeCard
                  node={child}
                  contacts={contacts}
                  expanded={expanded}
                  toggle={toggle}
                  depth={depth + 1}
                  onSelectContact={onSelectContact}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact Card Modal                                                 */
/* ------------------------------------------------------------------ */

const ROLE_TYPE_AVATAR_STYLES: Record<RoleType, { bg: string; border: string; text: string }> = {
  aviation: { bg: "bg-[#4F98A3]/15", border: "border-[#4F98A3]/40", text: "text-[#4F98A3]" },
  medical: { bg: "bg-purple-400/15", border: "border-purple-400/40", text: "text-purple-400" },
  engineering: { bg: "bg-orange-400/15", border: "border-orange-400/40", text: "text-orange-400" },
  management: { bg: "bg-green-400/15", border: "border-green-400/40", text: "text-green-400" },
};

function ContactCardModal({
  contact,
  vacantPositionTitle,
  roleType,
  onClose,
}: {
  contact: Contact | null;
  vacantPositionTitle: string | null;
  roleType: RoleType;
  onClose: () => void;
}) {
  const avatarStyles = ROLE_TYPE_AVATAR_STYLES[roleType];
  const isVacant = !contact;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#393836] bg-[#1C1B19] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-[#393836] flex items-start gap-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-md text-[#797876] hover:text-[#CDCCCA] hover:bg-[#171614] transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>

          <div
            className={`w-20 h-20 rounded-full ${avatarStyles.bg} border-2 ${avatarStyles.border} flex items-center justify-center shrink-0`}
          >
            <span
              className={`text-2xl font-bold ${avatarStyles.text}`}
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              {isVacant ? "—" : initials(contact.name)}
            </span>
          </div>

          <div className="min-w-0 pt-1">
            <div
              className="text-lg font-bold text-[#CDCCCA] leading-tight truncate"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              {isVacant ? "Vacant" : contact.name}
            </div>
            <div className="text-xs text-[#797876] mt-0.5 truncate">
              {isVacant ? vacantPositionTitle ?? "Position vacant" : contact.position}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-[#393836] bg-[#171614] text-[#797876]">
                <MapPin size={10} /> {isVacant ? "—" : contact.base}
              </span>
              {!isVacant && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[contact.onDutyStatus]}`}>
                  {contact.onDutyStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="p-5 border-b border-[#393836] space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <Phone size={14} className="text-[#5A5957] shrink-0" />
            <span className={contact?.phone ? "text-[#CDCCCA]" : "text-[#5A5957]"}>
              {contact?.phone || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Mail size={14} className="text-[#5A5957] shrink-0" />
            <span className={`truncate ${contact?.email ? "text-[#CDCCCA]" : "text-[#5A5957]"}`}>
              {contact?.email || "—"}
            </span>
          </div>
        </div>

        {/* Photo upload section */}
        <div className="p-5 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-[#393836] bg-[#171614] p-4 flex flex-col items-center text-center gap-2.5">
            <div className="p-2.5 rounded-full bg-[#1C1B19] border border-[#393836]">
              <Camera size={18} className="text-[#797876]" />
            </div>
            <p className="text-[11px] text-[#797876] leading-relaxed max-w-[280px]">
              Upload a photo to put a face to the name — helps remote teams build connection.
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled
                title="Photo uploads coming soon"
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#1C1B19] border border-[#393836] text-[#5A5957] cursor-not-allowed"
              >
                Choose Photo
              </button>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganisationChartTab({
  contacts,
  onSelectContact,
}: {
  contacts: Contact[];
  onSelectContact: (contact: Contact | null, node: OrgNode) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));

  const expandAll = () => setExpanded({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    const walk = (n: OrgNode) => {
      if (n.children?.length) {
        all[n.id] = false;
        n.children.forEach(walk);
      }
    };
    walk(ORG_TREE);
    setExpanded(all);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-[11px] text-[#797876]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#4F98A3]" /> Aviation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" /> Medical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Engineering
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Management
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg border border-[#393836] bg-[#1C1B19] text-[11px] text-[#CDCCCA] hover:border-[#4F98A3]/40 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg border border-[#393836] bg-[#1C1B19] text-[11px] text-[#CDCCCA] hover:border-[#4F98A3]/40 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#393836] bg-[#171614] p-6 overflow-x-auto">
        <div className="min-w-[900px] flex justify-center">
          <OrgNodeCard
            node={ORG_TREE}
            contacts={contacts}
            expanded={expanded}
            toggle={toggle}
            depth={0}
            onSelectContact={onSelectContact}
          />
        </div>
      </div>

      <p className="text-[11px] text-[#5A5957] flex items-center gap-1.5">
        <Info size={12} /> Click a card to view its contact details, or use the chevron to expand/collapse reports. Avatars are pulled live from the Key Contacts Directory.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2 — Key Contacts Directory                                     */
/* ------------------------------------------------------------------ */

function ContactEditPanel({
  contact,
  onSave,
  onCancel,
}: {
  contact: Contact;
  onSave: (updated: Contact) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const [email, setEmail] = useState(contact.email);
  const [status, setStatus] = useState<OnDutyStatus>(contact.onDutyStatus);

  return (
    <div className="mt-3 pt-3 border-t border-[#393836] space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">On-Duty Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OnDutyStatus)}
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
          >
            {(["On Duty", "Off Duty", "On Call", "On Leave"] as OnDutyStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-[#393836] text-[11px] text-[#797876] hover:text-[#CDCCCA] transition-colors flex items-center gap-1"
        >
          <X size={12} /> Cancel
        </button>
        <button
          onClick={() => onSave({ ...contact, name, phone, email, onDutyStatus: status })}
          className="px-3 py-1.5 rounded-lg border border-[#4F98A3]/30 bg-[#01696F]/20 text-[11px] text-[#4F98A3] hover:bg-[#01696F]/30 transition-colors flex items-center gap-1"
        >
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  );
}

function AddPositionForm({ onAdd, onCancel }: { onAdd: (c: Contact) => void; onCancel: () => void }) {
  const [position, setPosition] = useState("");
  const [name, setName] = useState("");
  const [base, setBase] = useState<string>(BASES[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!position.trim() || !name.trim()) return;
    onAdd({
      id: `C${Math.floor(Math.random() * 90000 + 10000)}`,
      position: position.trim(),
      name: name.trim(),
      base,
      phone: phone.trim() || "—",
      email: email.trim() || "—",
      onDutyStatus: "Off Duty",
      isCurrent: true,
    });
  };

  return (
    <div className="rounded-xl border border-[#4F98A3]/30 bg-[#1C1B19] p-4 space-y-3">
      <div className="text-sm font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        Add New Position
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Position Title</label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Retrieval Nurse"
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Base</label>
          <select
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50"
          >
            {BASES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[#797876]">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="04xx xxx xxx"
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] text-[#797876]">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@rfds.org.au"
            className="w-full bg-[#171614] border border-[#393836] rounded-lg px-2.5 py-1.5 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-[#393836] text-[11px] text-[#797876] hover:text-[#CDCCCA] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="px-3 py-1.5 rounded-lg border border-[#4F98A3]/30 bg-[#01696F]/20 text-[11px] text-[#4F98A3] hover:bg-[#01696F]/30 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add Position
        </button>
      </div>
    </div>
  );
}

function KeyContactsTab({
  contacts,
  setContacts,
  role,
}: {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  role: UserRole;
}) {
  const [search, setSearch] = useState("");
  const [baseFilter, setBaseFilter] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const editable = canEdit(role);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.position.toLowerCase().includes(search.toLowerCase());
      const matchBase = baseFilter === "All" || c.base === baseFilter;
      return matchSearch && matchBase;
    });
  }, [contacts, search, baseFilter]);

  const saveContact = (updated: Contact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingId(null);
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, isCurrent: false } : c)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#393836] bg-[#1C1B19] px-3 py-2 flex items-center gap-2 text-[11px] text-[#797876]">
        <Info size={13} className="text-[#4F98A3] shrink-0" />
        Changes save to session only — data resets on page reload.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5957]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full bg-[#1C1B19] border border-[#393836] rounded-lg pl-9 pr-3 py-2 text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
          />
        </div>
        {role === "admin" && (
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="px-3 py-2 rounded-lg border border-[#4F98A3]/30 bg-[#01696F]/20 text-[#4F98A3] text-xs font-semibold hover:bg-[#01696F]/30 transition-colors flex items-center gap-1.5 self-start"
          >
            <Plus size={14} /> Add Position
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {["All", ...BASES].map((b) => (
          <button
            key={b}
            onClick={() => setBaseFilter(b)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
              baseFilter === b
                ? "bg-[#01696F]/20 border-[#4F98A3]/40 text-[#4F98A3]"
                : "bg-[#1C1B19] border-[#393836] text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {showAdd && (
        <AddPositionForm
          onAdd={(c) => {
            setContacts((prev) => [...prev, c]);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered
          .filter((c) => c.isCurrent)
          .map((c) => (
            <div key={c.id} className="rounded-xl border border-[#393836] bg-[#1C1B19] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#01696F]/20 border border-[#4F98A3]/30 flex items-center justify-center text-xs font-bold text-[#4F98A3] shrink-0">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#CDCCCA] truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                      {c.name}
                    </div>
                    <div className="text-[11px] text-[#797876] truncate">{c.position}</div>
                  </div>
                </div>
                {editable && editingId !== c.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(c.id)}
                      className="p-1.5 rounded-md border border-[#393836] text-[#797876] hover:text-[#4F98A3] hover:border-[#4F98A3]/40 transition-colors"
                      title="Edit contact"
                    >
                      <Pencil size={12} />
                    </button>
                    {role === "admin" && (
                      <button
                        onClick={() => removeContact(c.id)}
                        className="p-1.5 rounded-md border border-[#393836] text-[#797876] hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title="Mark vacant"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingId === c.id ? (
                <ContactEditPanel contact={c} onSave={saveContact} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-[#393836] bg-[#171614] text-[#797876]">
                      <MapPin size={10} /> {c.base}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[c.onDutyStatus]}`}>
                      {c.onDutyStatus}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[#CDCCCA]">
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} className="text-[#5A5957]" /> {c.phone}
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={11} className="text-[#5A5957] shrink-0" /> <span className="truncate">{c.email}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        {filtered.filter((c) => c.isCurrent).length === 0 && (
          <div className="col-span-full text-center py-10 text-sm text-[#797876]">No contacts match your search.</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 3 — Onboarding & Offboarding SOPs                              */
/* ------------------------------------------------------------------ */

interface SopDoc {
  id: string;
  title: string;
  category: "onboarding" | "offboarding" | "handover" | "emergency";
}

const SOP_DOCS: SopDoc[] = [
  { id: "pilot-onboarding", title: "Pilot Onboarding Checklist", category: "onboarding" },
  { id: "nurse-onboarding", title: "Nurse/Medical Staff Onboarding", category: "onboarding" },
  { id: "eng-onboarding", title: "Engineering Staff Onboarding", category: "onboarding" },
  { id: "general-offboarding", title: "General Staff Offboarding Checklist", category: "offboarding" },
  { id: "base-handover", title: "Base Manager Handover SOP", category: "handover" },
  { id: "emergency-contacts", title: "Emergency Contact Update Procedure", category: "emergency" },
];

function LiveField({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#01696F]/20 border border-[#4F98A3]/30 text-[#4F98A3] font-semibold text-[11px]">
      <Link2 size={10} /> {children}
    </span>
  );
}

function ChecklistSection({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-[#CDCCCA] uppercase tracking-wide" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {title}
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <label key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#171614] border border-[#393836] text-xs text-[#CDCCCA] leading-relaxed">
            <input type="checkbox" className="mt-0.5 accent-[#4F98A3]" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SopContent({ doc, contacts }: { doc: SopDoc; contacts: Contact[] }) {
  const dubboManager = findContactByPosition(contacts, "Base Manager — Dubbo");
  const checkTraining = findContactByPosition(contacts, "Check & Training Captain");
  const chiefPilot = findContactByPosition(contacts, "Chief Pilot");
  const seniorNurse = findContactByPosition(contacts, "Senior Retrieval Nurse");
  const medicalDirector = findContactByPosition(contacts, "Director of Medical Services");
  const engDirector = findContactByPosition(contacts, "Director of Engineering");
  const genericBaseManager = findContactByPosition(contacts, "Base Manager — Dubbo");

  const nameOr = (c: Contact | undefined) => (c ? c.name : "Vacant");
  const phoneOr = (c: Contact | undefined) => (c ? c.phone : "—");

  if (doc.id === "pilot-onboarding") {
    return (
      <div className="space-y-6">
        <ChecklistSection
          title="Pre-arrival"
          items={[
            "Verify CASA licence and medical certificate currency",
            "Complete reference checks with two most recent operators",
            "Submit AusCheck / ASIC security clearance application",
          ]}
        />
        <ChecklistSection
          title="Day 1 — Base Orientation"
          items={[
            <>Base orientation conducted by <LiveField>{nameOr(dubboManager)}</LiveField> (Base Manager — Dubbo)</>,
            "Site safety induction and emergency muster point briefing",
            "Issue base access pass, hangar keys and crew room orientation",
          ]}
        />
        <ChecklistSection
          title="Week 1 — Systems Access"
          items={[
            "Provision Medivac.ai login credentials and MFA enrolment",
            "Register for NAIPS (NOTAMs, briefings, flight notification)",
            "Set up AVPLAN EFB account and sync aircraft profiles",
          ]}
        />
        <ChecklistSection
          title="Training & Check"
          items={[
            <>Schedule base check and line training with <LiveField>{nameOr(checkTraining)}</LiveField> (Check & Training Captain)</>,
            "Complete type-specific simulator or aircraft check-out",
            "File initial line check sign-off in training record",
          ]}
        />
        <ChecklistSection
          title="Emergency Contacts"
          items={[
            <>Chief Pilot: <LiveField>{nameOr(chiefPilot)} {phoneOr(chiefPilot)}</LiveField></>,
            <>Base Manager — Dubbo: <LiveField>{nameOr(dubboManager)} {phoneOr(dubboManager)}</LiveField></>,
          ]}
        />
      </div>
    );
  }

  if (doc.id === "nurse-onboarding") {
    return (
      <div className="space-y-6">
        <ChecklistSection
          title="Pre-arrival"
          items={[
            "Verify AHPRA registration and clinical currency",
            "Confirm immunisation and fit-for-duty medical clearance",
            "Submit security clearance and working-with-vulnerable-people check",
          ]}
        />
        <ChecklistSection
          title="Day 1 — Base Orientation"
          items={[
            <>Clinical orientation led by <LiveField>{nameOr(seniorNurse)}</LiveField> (Senior Retrieval Nurse)</>,
            "Medical equipment and drug safe induction",
            "Base safety induction and rostering system walkthrough",
          ]}
        />
        <ChecklistSection
          title="Week 1 — Systems Access"
          items={[
            "Provision Medivac.ai login and clinical documentation access",
            "Stock/ordering system credentials for consumables",
            "Telehealth portal access provisioning",
          ]}
        />
        <ChecklistSection
          title="Training & Sign-off"
          items={[
            <>Retrieval competency sign-off with <LiveField>{nameOr(medicalDirector)}</LiveField> (Director of Medical Services)</>,
            "Complete aeromedical retrieval simulation training",
          ]}
        />
        <ChecklistSection
          title="Emergency Contacts"
          items={[
            <>Director of Medical Services: <LiveField>{nameOr(medicalDirector)} {phoneOr(medicalDirector)}</LiveField></>,
            <>Senior Retrieval Nurse: <LiveField>{nameOr(seniorNurse)} {phoneOr(seniorNurse)}</LiveField></>,
          ]}
        />
      </div>
    );
  }

  if (doc.id === "eng-onboarding") {
    return (
      <div className="space-y-6">
        <ChecklistSection
          title="Pre-arrival"
          items={[
            "Verify CASA Part 66 licence and aircraft type ratings",
            "Confirm toolbox calibration and equipment compliance",
          ]}
        />
        <ChecklistSection
          title="Day 1 — Hangar Orientation"
          items={[
            <>Hangar orientation with <LiveField>{nameOr(engDirector)}</LiveField> (Director of Engineering)</>,
            "Workshop safety induction (fuel, hazchem, lifting equipment)",
          ]}
        />
        <ChecklistSection
          title="Week 1 — Systems Access"
          items={[
            "Provision Medivac.ai maintenance module access",
            "CAMO / maintenance tracking system credentials",
          ]}
        />
        <ChecklistSection
          title="Emergency Contacts"
          items={[
            <>Director of Engineering: <LiveField>{nameOr(engDirector)} {phoneOr(engDirector)}</LiveField></>,
          ]}
        />
      </div>
    );
  }

  if (doc.id === "general-offboarding") {
    return (
      <div className="space-y-6">
        <ChecklistSection
          title="System Access Revocation"
          items={[
            "Disable Medivac.ai login and revoke API tokens",
            "Remove NAIPS registration",
            "Remove AVPLAN EFB account access",
            "Disable company email account and forwarding rules",
          ]}
        />
        <ChecklistSection
          title="Key / FOB / Equipment Return"
          items={[
            "Collect base access FOB and hangar keys",
            "Return issued PPE, radios and mobile devices",
            "Return company vehicle keys and fuel cards",
          ]}
        />
        <ChecklistSection
          title="Notification"
          items={[
            <>Forward handover notes to <LiveField>{nameOr(genericBaseManager)}</LiveField> (Base Manager)</>,
            "Notify payroll and HR of final working day",
          ]}
        />
        <ChecklistSection
          title="Regulatory"
          items={[
            "Submit CASA notification if role required licence-holder record update",
          ]}
        />
        <ChecklistSection
          title="Update Org Chart"
          items={[
            <span className="flex items-center gap-3">
              Mark departed staff member's position as vacant in the directory
              <button className="px-2.5 py-1 rounded-md border border-red-400/30 bg-red-400/10 text-red-400 text-[10px] font-semibold">
                Mark Position as Vacant
              </button>
            </span>,
          ]}
        />
      </div>
    );
  }

  if (doc.id === "base-handover") {
    return (
      <div className="space-y-6">
        <ChecklistSection
          title="Outgoing Base Manager"
          items={[
            <>Current Base Manager — Dubbo: <LiveField>{nameOr(dubboManager)}</LiveField> to brief incoming manager on open items</>,
            "Hand over base operating budget and rostering approvals",
            "Transfer signatory authority for local purchasing",
          ]}
        />
        <ChecklistSection
          title="Incoming Base Manager"
          items={[
            "Walkthrough of hangar, crew facilities and local emergency procedures",
            "Introduce to on-base crew and update Medivac.ai directory record",
          ]}
        />
        <ChecklistSection
          title="Communication"
          items={[
            <>Notify Director of Aviation Operations and all on-base crew of handover effective date</>,
          ]}
        />
      </div>
    );
  }

  // emergency-contacts
  return (
    <div className="space-y-6">
      <ChecklistSection
        title="Update Procedure"
        items={[
          "Confirm updated phone/email details with the position holder",
          "Update record in Key Contacts Directory (auto-propagates to all linked SOPs)",
          "Notify Dispatch/ACC of any after-hours contact changes",
        ]}
      />
      <ChecklistSection
        title="Current Critical Contacts"
        items={[
          <>Chief Pilot: <LiveField>{nameOr(chiefPilot)} {phoneOr(chiefPilot)}</LiveField></>,
          <>Director of Medical Services: <LiveField>{nameOr(medicalDirector)} {phoneOr(medicalDirector)}</LiveField></>,
          <>Director of Engineering: <LiveField>{nameOr(engDirector)} {phoneOr(engDirector)}</LiveField></>,
        ]}
      />
    </div>
  );
}

function SopTab({ contacts }: { contacts: Contact[] }) {
  const [selected, setSelected] = useState<SopDoc>(SOP_DOCS[0]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#4F98A3]/30 bg-[#01696F]/10 px-3 py-2 flex items-center gap-2 text-[11px] text-[#4F98A3]">
        <Link2 size={13} className="shrink-0" />
        SOPs auto-update when contact positions are edited in the Key Contacts tab.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-1.5">
          {SOP_DOCS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelected(doc)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 ${
                selected.id === doc.id
                  ? "border-[#4F98A3]/50 bg-[#01696F]/20 text-[#4F98A3]"
                  : "border-[#393836] bg-[#1C1B19] text-[#CDCCCA] hover:border-[#4F98A3]/30"
              }`}
            >
              <ClipboardList size={13} className="shrink-0" />
              {doc.title}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 rounded-xl border border-[#393836] bg-[#1C1B19] p-5">
          <div className="mb-4">
            <div className="text-sm font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {selected.title}
            </div>
            <p className="text-[11px] text-[#5A5957] mt-1">
              Fields highlighted in <span className="text-[#4F98A3] font-medium">cyan</span> are live-linked to the Key Contacts Directory.
            </p>
          </div>
          <SopContent doc={selected} contacts={contacts} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OrgChart({ role }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [tab, setTab] = useState<"chart" | "contacts" | "sop">("chart");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [vacantNodeTitle, setVacantNodeTitle] = useState<string | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType>("management");
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = [
    { id: "chart" as const, label: "Organisation Chart", icon: Network },
    { id: "contacts" as const, label: "Key Contacts Directory", icon: Users },
    { id: "sop" as const, label: "Onboarding & Offboarding SOPs", icon: ClipboardList },
  ];

  function handleSelectContact(contact: Contact | null, node: OrgNode) {
    setSelectedContact(contact);
    setVacantNodeTitle(contact ? null : node.title);
    setSelectedRoleType(node.roleType);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  return (
    <div className="p-6 space-y-6 bg-[#171614] min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Org Chart &amp; Key Contacts
          </h1>
          <p className="text-sm text-[#797876] mt-0.5">
            Living company directory — the single source of truth that keeps onboarding and offboarding SOPs accurate.
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-[#1C1B19] border border-[#393836] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                tab === t.id ? "bg-[#01696F]/20 text-[#4F98A3]" : "text-[#797876] hover:text-[#CDCCCA]"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "chart" && <OrganisationChartTab contacts={contacts} onSelectContact={handleSelectContact} />}
      {tab === "contacts" && <KeyContactsTab contacts={contacts} setContacts={setContacts} role={role} />}
      {tab === "sop" && <SopTab contacts={contacts} />}

      {modalOpen && (
        <ContactCardModal
          contact={selectedContact}
          vacantPositionTitle={vacantNodeTitle}
          roleType={selectedRoleType}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
