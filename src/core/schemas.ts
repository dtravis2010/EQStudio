export type AnswerValue = string | number | boolean | string[] | null;

export type QuestionType =
  | "YesNo" | "SingleSelect" | "MultiSelect"
  | "FreeText" | "Number"
  | "Date" | "Time" | "DateTime";

export interface Question {
  id: string;
  name: string;
  prompt: string;
  type: QuestionType;
  options?: { id: string; label: string; value: string }[]; // for selects
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string; // regex
  };
  displayHints?: {
    helpText?: string;
    placeholder?: string;
    group?: string; // section/tab
  };
  folderId?: string;
}

export type Comparator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in" | "notin" | "isEmpty" | "isNotEmpty";

export interface Condition {
  questionId: string;
  comparator: Comparator;
  value?: AnswerValue;           // omit for isEmpty/isNotEmpty
}

export type RuleAction =
  | { type: "ShowNode"; nodeId: string }
  | { type: "SkipNode"; nodeId: string }
  | { type: "SetVisitType"; visitTypeId: string }
  | { type: "FlipVisitType"; from?: string; to: string }
  | { type: "SetSchedulingPool"; poolId: string };

export interface Rule {
  id: string;
  all?: Condition[];             // AND
  any?: Condition[];             // OR
  not?: Condition[];             // optional NOT
  action: RuleAction;
  note?: string;
  folderId?: string;
}

export type NodeKind = "Start" | "Question" | "Gate" | "VisitType" | "Pool" | "End";

export interface Node {
  id: string;
  kind: NodeKind;
  questionId?: string;           // if kind === "Question"
  visitTypeId?: string;          // if kind === "VisitType"
  poolId?: string;               // if kind === "Pool"
  position: { x: number; y: number };
  meta?: { color?: string; icon?: string; shape?: 'rect'|'pill' };
}

export interface Edge {
  id: string;
  from: string; // node id
  to: string;   // node id
  label?: string;
  edgeConditions?: Condition[]; // simple per-edge conditions (AND logic)
  conditions?: Rule[]; // legacy / advanced rule objects (optional)
}

export interface VisitType {
  id: string;
  name: string;       // e.g., "MRI_BRAIN_WWO"
  category?: string;
  code?: string;
  notes?: string;
}

export interface SchedulingPool {
  id: string;
  name: string;
  category?: string;
  notes?: string;
}

export interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  questionIds: string[]; // ordered list
  tags?: string[];
  folderId?: string;
}

export type LibraryFolderKind = 'question' | 'questionnaire' | 'rule'
export interface LibraryFolder {
  id: string;
  name: string;
  kind: LibraryFolderKind;
  parentId?: string; // optional nesting
}

export interface Workspace {
  id: string;
  name: string;
  version: "1.0";
  nodes: Node[];
  edges: Edge[];
  questions: Question[];
  visitTypes: VisitType[];
  pools: SchedulingPool[];
  rules: Rule[];
  library?: { questions: Question[]; visitTypes: VisitType[]; pools: SchedulingPool[] };
  aiNotes?: string[];
  createdAt: string;
  updatedAt: string;
  questionnaires?: Questionnaire[];
  folders?: LibraryFolder[];
}
