// Min Jobbuddy — component props. Global: window.MinJobbuddy. Documentation, not type-checked.
type Children = any;
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Status = 'success' | 'warning' | 'danger' | 'info';
/** 2838.75 → "2.838,75 kr." */
export declare function formatKr(amount: number): string;
/** 25.5 → "25,5" */
export declare function formatHours(hours: number): string;
/** "2026-10-11" → "11. okt. 2026" */
export declare function formatDate(isoDate: string, withYear?: boolean): string;
export declare function weekdayShort(isoDate: string): string;
export interface IconProps {
    name: string;
    size?: number;
    label?: string;
    className?: string;
    strokeWidth?: number;
}
export declare function Icon({ name, size, label, className, strokeWidth }: IconProps): any;
export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'navy';
    size?: 'sm' | 'md' | 'lg';
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    iconRight?: string;
    className?: string;
    type?: 'button' | 'submit';
    onClick?: () => void;
    children?: Children;
}
export declare function Button({ variant, size, block, loading, disabled, icon, iconRight, className, type, onClick, children }: ButtonProps): any;
export interface BadgeProps {
    tone?: Tone;
    icon?: string;
    children?: Children;
    className?: string;
}
/** Status tones always get an icon, so colour never carries meaning alone. */
export declare function Badge({ tone, icon, children, className }: BadgeProps): any;
export interface TextFieldProps {
    label: string;
    value?: string;
    type?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    inputMode?: string;
    suffix?: string;
    className?: string;
    inputClassName?: string;
    onChange?: (value: string) => void;
}
export declare function TextField({ label, value, type, placeholder, hint, error, disabled, inputMode, className, inputClassName, onChange }: TextFieldProps): any;
export declare function Progress({ value, label }: {
    value: number;
    label: string;
}): any;
export declare function Skeleton({ width, height, radius }: {
    width?: number | string;
    height?: number;
    radius?: string;
}): any;
/** The "Spor" mark: a j drawn in one thick stroke with a dot above. `tile` puts it on a primary rounded square. */
export declare function LogoMark({ size, tile }: {
    size?: number;
    tile?: boolean;
}): any;
export declare function Logo({ size, showName, tile }: {
    size?: number;
    showName?: boolean;
    tile?: boolean;
}): any;
export interface HeaderAction {
    icon: string;
    label: string;
    onClick?: () => void;
    badge?: boolean;
    disabled?: boolean;
}
export interface AppHeaderProps {
    title?: string;
    onBack?: () => void;
    action?: HeaderAction;
    focusBack?: boolean;
}
export declare function AppHeader({ title, onBack, action, focusBack }: AppHeaderProps): any;
export interface GreetingCardProps {
    firstName: string;
    job: string;
    workplace: string;
    agreement: string;
    loading?: boolean;
    onChangeAgreement?: () => void;
}
export declare function GreetingCard({ firstName, job, workplace, agreement, loading }: GreetingCardProps): any;
export interface FeatureTileProps {
    icon: string;
    title: string;
    description: string;
    status?: {
        tone: Status;
        text: string;
    };
    disabled?: boolean;
    focused?: boolean;
    onClick?: () => void;
}
export declare function FeatureTile({ icon, title, description, status, disabled, focused, onClick }: FeatureTileProps): any;
export interface PromoBannerProps {
    title: string;
    text: string;
    actionLabel: string;
    icon?: string;
    disabled?: boolean;
    onClick?: () => void;
}
export declare function PromoBanner({ title, text, actionLabel, icon, disabled, onClick }: PromoBannerProps): any;
export type TabId = 'home' | 'ai' | 'me';
export interface BottomTabBarProps {
    active: TabId;
    onChange?: (tab: TabId) => void;
    focusedTab?: TabId;
}
export declare function BottomTabBar({ active, onChange, focusedTab }: BottomTabBarProps): any;
export type UploadStatus = 'idle' | 'uploading' | 'reading' | 'done' | 'error';
export interface UploadCardProps {
    title: string;
    description: string;
    status: UploadStatus;
    fileName?: string;
    progress?: number;
    error?: string;
    readingText?: string;
    doneText?: string;
    disabled?: boolean;
    onSelect?: () => void;
    onRetry?: () => void;
    children?: Children;
}
export declare function UploadCard({ title, description, status, fileName, progress, error, readingText, doneText, disabled, onSelect, onRetry, children }: UploadCardProps): any;
export interface MaskedFieldProps {
    label: string;
    maskedValue: string;
    badgeText?: string;
}
export declare function MaskedField({ label, maskedValue, badgeText }: MaskedFieldProps): any;
export interface FactRowProps {
    label: string;
    value: string;
    source: string;
    edited?: boolean;
    disabled?: boolean;
    loading?: boolean;
    focused?: boolean;
    onEdit?: () => void;
}
export declare function FactRow({ label, value, source, edited, disabled, loading, focused, onEdit }: FactRowProps): any;
export declare function FactList({ children, label }: {
    children?: Children;
    label?: string;
}): any;
export interface ShiftListItemProps {
    date: string;
    start: string;
    end: string;
    pauseMinutes?: number;
    hours: number;
    expectedPay: number;
    supplement?: string;
    disabled?: boolean;
    focused?: boolean;
    onClick?: () => void;
}
export declare function ShiftListItem({ date, start, end, pauseMinutes, hours, expectedPay, supplement, disabled, focused, onClick }: ShiftListItemProps): any;
export interface MonthCalendarProps {
    year: number;
    month: number;
    shiftDays: number[];
    selectedDay?: number;
    today?: number;
    disabled?: boolean;
    focusedDay?: number;
    onSelect?: (day: number) => void;
    onPrev?: () => void;
    onNext?: () => void;
}
export declare function MonthCalendar({ year, month, shiftDays, selectedDay, today, disabled, focusedDay, onSelect, onPrev, onNext }: MonthCalendarProps): any;
export interface ShiftFormValues {
    date: string;
    start: string;
    end: string;
    pause: string;
}
export interface ShiftFormProps {
    values: ShiftFormValues;
    errors?: Partial<Record<keyof ShiftFormValues, string>>;
    summary?: string;
    submitting?: boolean;
    disabled?: boolean;
    onChange?: (values: ShiftFormValues) => void;
    onSubmit?: () => void;
    onCancel?: () => void;
}
export declare function ShiftForm({ values, errors, summary, submitting, disabled, onChange, onSubmit, onCancel }: ShiftFormProps): any;
export interface PayCheckSummaryProps {
    month: string;
    expected: number;
    paid: number;
    issueCount: number;
    loading?: boolean;
}
export declare function PayCheckSummary({ month, expected, paid, issueCount, loading }: PayCheckSummaryProps): any;
export interface DeviationDetail {
    label: string;
    value: string;
}
export interface DeviationCardProps {
    title: string;
    date: string;
    amount: number;
    details: DeviationDetail[];
    explanation?: string;
    defaultExpanded?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    focused?: boolean;
    onToggle?: (expanded: boolean) => void;
    children?: Children;
}
export declare function DeviationCard({ title, date, amount, details, explanation, defaultExpanded, expanded, disabled, focused, onToggle, children }: DeviationCardProps): any;
export interface ChatBubbleProps {
    from: 'user' | 'ai';
    children?: Children;
    source?: string;
    typing?: boolean;
    error?: string;
    onRetry?: () => void;
}
export declare function ChatBubble({ from, children, source, typing, error, onRetry }: ChatBubbleProps): any;
export interface SuggestedQuestionChipsProps {
    questions: string[];
    disabled?: boolean;
    focusedIndex?: number;
    onSelect?: (question: string) => void;
}
export declare function SuggestedQuestionChips({ questions, disabled, focusedIndex, onSelect }: SuggestedQuestionChipsProps): any;
export interface ChatInputProps {
    value: string;
    remaining?: number;
    total?: number;
    disabled?: boolean;
    sending?: boolean;
    focused?: boolean;
    onChange?: (value: string) => void;
    onSend?: () => void;
}
export declare function ChatInput({ value, remaining, total, disabled, sending, focused, onChange, onSend }: ChatInputProps): any;
export declare function AiDisclaimer({ boxed }: {
    boxed?: boolean;
}): any;
export interface EscalationCardProps {
    title?: string;
    text: string;
    shareLabel?: string;
    laterLabel?: string;
    disabled?: boolean;
    onShare?: () => void;
    onLater?: () => void;
}
export declare function EscalationCard({ title, text, shareLabel, laterLabel, disabled, onShare, onLater }: EscalationCardProps): any;
export interface SharedItem {
    label: string;
    value: string;
}
export interface ConsentSheetProps {
    open: boolean;
    recipient: string;
    shared: SharedItem[];
    notShared: string[];
    sending?: boolean;
    inline?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}
export declare function ConsentSheet({ open, recipient, shared, notShared, sending, inline, onConfirm, onCancel }: ConsentSheetProps): any;
export interface ConsentToggleProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    focused?: boolean;
    onChange?: (checked: boolean) => void;
}
export declare function ConsentToggle({ label, description, checked, disabled, focused, onChange }: ConsentToggleProps): any;
export interface PlanCardProps {
    name: string;
    price: string;
    features: string[];
    current?: boolean;
    usage?: {
        used: number;
        total: number;
        unit: string;
    };
    ctaLabel?: string;
    disabled?: boolean;
    onSelect?: () => void;
}
export declare function PlanCard({ name, price, features, current, usage, ctaLabel, disabled, onSelect }: PlanCardProps): any;
export interface EmptyStateProps {
    icon?: string;
    title: string;
    text: string;
    actionLabel?: string;
    actionIcon?: string;
    onAction?: () => void;
}
export declare function EmptyState({ icon, title, text, actionLabel, actionIcon, onAction }: EmptyStateProps): any;
export interface LoadingSkeletonProps {
    variant?: 'list' | 'card' | 'text';
    rows?: number;
    label?: string;
}
export declare function LoadingSkeleton({ variant, rows, label }: LoadingSkeletonProps): any;
export interface ErrorStateProps {
    title?: string;
    text: string;
    retryLabel?: string;
    retrying?: boolean;
    onRetry?: () => void;
}
export declare function ErrorState({ title, text, retryLabel, retrying, onRetry }: ErrorStateProps): any;
export declare const exampleData: {
    user: {
        firstName: string;
        age: number;
        job: string;
        workplace: string;
        agreement: string;
    };
    terms: {
        label: string;
        value: string;
        source: string;
    }[];
    shifts: ({
        date: string;
        start: string;
        end: string;
        pauseMinutes: number;
        hours: number;
        expectedPay: number;
        supplement: string;
    } | {
        date: string;
        start: string;
        end: string;
        pauseMinutes: number;
        hours: number;
        expectedPay: number;
        supplement?: undefined;
    })[];
    totals: {
        hours: number;
        expectedPay: number;
    };
    payslip: {
        month: string;
        hours: number;
        eveningHours: number;
        sundayHours: number;
        grossPay: number;
    };
    deviations: {
        title: string;
        date: string;
        amount: number;
        details: {
            label: string;
            value: string;
        }[];
    }[];
    questions: string[];
};
export {};
