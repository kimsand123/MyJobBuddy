/* Min Jobbuddy — reference components.
 * Plain React + bundle.css so the design system can preview them. In the real PWA, rebuild each one
 * on the shadcn/ui primitive named in its README (Button, Card, Input, Sheet, Dialog, Tabs, Switch,
 * Badge, Progress, Calendar) and swap <Icon name="x" /> for the lucide-react icon of the same name. */
import { ICONS } from './icons';

const React: any = (window as any).React;
const h = React.createElement;
const Fragment = React.Fragment;
const useState = React.useState;
const useId: () => string = React.useId;

type Children = any;
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Status = 'success' | 'warning' | 'danger' | 'info';

const cx = (...classNames: Array<string | false | null | undefined>): string => classNames.filter(Boolean).join(' ');

/* ---------- Formatting (Danish) ---------- */
const MONTHS_SHORT: string[] = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const MONTHS_LONG: string[] = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const WEEKDAYS_SHORT: string[] = ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'];

/** 2838.75 → "2.838,75 kr." */
export function formatKr(amount: number): string {
  const fixedAmount: string = Math.abs(amount).toFixed(2);
  const [wholePart, decimalPart] = fixedAmount.split('.');
  const groupedWhole: string = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (amount < 0 ? '−' : '') + groupedWhole + ',' + decimalPart + ' kr.';
}
/** 25.5 → "25,5" */
export function formatHours(hours: number): string {
  return String(Math.round(hours * 100) / 100).replace('.', ',');
}
/** "2026-10-11" → "11. okt. 2026" */
export function formatDate(isoDate: string, withYear: boolean = true): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return day + '. ' + MONTHS_SHORT[month - 1] + (withYear ? ' ' + year : '');
}
export function weekdayShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return WEEKDAYS_SHORT[new Date(year, month - 1, day).getDay()];
}

/* ---------- Primitives ---------- */
export interface IconProps { name: string; size?: number; label?: string; className?: string; strokeWidth?: number }
export function Icon({ name, size = 24, label, className, strokeWidth = 2 }: IconProps) {
  return h('svg', {
    className: cx('mj-icon', className), width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', role: label ? 'img' : undefined,
    'aria-label': label, 'aria-hidden': label ? undefined : true, dangerouslySetInnerHTML: { __html: ICONS[name] || '' },
  });
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'navy';
  size?: 'sm' | 'md' | 'lg'; block?: boolean; loading?: boolean; disabled?: boolean;
  icon?: string; iconRight?: string; className?: string; type?: 'button' | 'submit'; onClick?: () => void; children?: Children;
}
export function Button({ variant = 'primary', size = 'md', block, loading, disabled, icon, iconRight, className, type = 'button', onClick, children }: ButtonProps) {
  return h('button', {
    type, onClick, disabled: disabled || loading, 'aria-busy': loading || undefined,
    className: cx('mj-btn mj-focusable', 'mj-btn-' + variant, size !== 'md' && 'mj-btn-' + size, block && 'mj-btn-block', className),
  },
    loading ? h(Icon, { name: 'loader-circle', size: 20, className: 'mj-spin' }) : icon && h(Icon, { name: icon, size: 20 }),
    children,
    !loading && iconRight && h(Icon, { name: iconRight, size: 20 }));
}

const STATUS_ICON: Record<Status, string> = { success: 'circle-check', warning: 'triangle-alert', danger: 'circle-alert', info: 'info' };
export interface BadgeProps { tone?: Tone; icon?: string; children?: Children; className?: string }
/** Status tones always get an icon, so colour never carries meaning alone. */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  const iconName: string | undefined = icon || (STATUS_ICON as any)[tone];
  return h('span', { className: cx('mj-badge', 'mj-badge-' + tone, className) }, iconName && h(Icon, { name: iconName, size: 14, strokeWidth: 2.5 }), children);
}

export interface TextFieldProps {
  label: string; value?: string; type?: string; placeholder?: string; hint?: string; error?: string; disabled?: boolean;
  inputMode?: string; suffix?: string; className?: string; inputClassName?: string; onChange?: (value: string) => void;
}
export function TextField({ label, value, type = 'text', placeholder, hint, error, disabled, inputMode, className, inputClassName, onChange }: TextFieldProps) {
  const fieldId: string = useId();
  const describedBy: string = cx(hint && fieldId + '-hint', error && fieldId + '-error');
  return h('div', { className: cx('mj-field', className) },
    h('label', { className: 'mj-label', htmlFor: fieldId }, label),
    h('input', {
      id: fieldId, className: cx('mj-input mj-focusable', inputClassName), type, value, placeholder, disabled, inputMode,
      'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined,
      onChange: (event: any) => onChange && onChange(event.target.value), readOnly: !onChange,
    }),
    hint && !error && h('p', { className: 'mj-hint', id: fieldId + '-hint' }, hint),
    error && h('p', { className: 'mj-error', id: fieldId + '-error' }, h(Icon, { name: 'circle-alert', size: 18 }), error));
}

export function Progress({ value, label }: { value: number; label: string }) {
  return h('div', { className: 'mj-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': value, 'aria-label': label },
    h('span', { style: { width: Math.max(0, Math.min(100, value)) + '%' } }));
}

export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | string; height?: number; radius?: string }) {
  return h('span', { className: 'mj-skel', style: { width, height, borderRadius: radius }, 'aria-hidden': true });
}

/* ---------- Logo ---------- */
/** The "Spor" mark: a j drawn in one thick stroke with a dot above. `tile` puts it on a primary rounded square. */
export function LogoMark({ size = 32, tile = true }: { size?: number; tile?: boolean }) {
  const glyphTransform: string = tile ? 'translate(32 32) scale(0.95) translate(-28 -30.5)' : 'translate(4 1.5)';
  return h('svg', { width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true, className: cx('mj-icon mj-mark', tile ? 'is-tile' : 'is-glyph') },
    tile && h('rect', { className: 'mj-mark-bg', width: 64, height: 64, rx: 18 }),
    h('g', { transform: glyphTransform },
      h('path', { className: 'mj-mark-stroke', d: 'M38 28v10a10 10 0 0 1-20 0', fill: 'none', strokeWidth: 10, strokeLinecap: 'round' }),
      h('circle', { className: 'mj-mark-dot', cx: 38, cy: 14, r: 6 })));
}
export function Logo({ size = 32, showName = true, tile = true }: { size?: number; showName?: boolean; tile?: boolean }) {
  return h('span', { className: 'mj-logo' }, h(LogoMark, { size, tile }), showName ? h('span', { className: 'mj-logo-name' }, 'Min Jobbuddy') : h('span', { className: 'mj-sr' }, 'Min Jobbuddy'));
}

/* ---------- Navigation & home ---------- */
export interface HeaderAction { icon: string; label: string; onClick?: () => void; badge?: boolean; disabled?: boolean }
export interface AppHeaderProps { title?: string; onBack?: () => void; action?: HeaderAction; focusBack?: boolean }
export function AppHeader({ title, onBack, action, focusBack }: AppHeaderProps) {
  return h('header', { className: 'mj-header' },
    h('div', { className: cx('mj-header-bar', onBack && 'has-back') },
      onBack && h('button', { type: 'button', className: cx('mj-iconbtn mj-focusable', focusBack && 'is-focus'), onClick: onBack, 'aria-label': 'Tilbage' }, h(Icon, { name: 'chevron-left', size: 28 })),
      title ? h('h1', { className: 'mj-header-title' }, title) : h(Logo, { size: 32 }),
      action && h('button', { type: 'button', className: 'mj-iconbtn mj-focusable', onClick: action.onClick, disabled: action.disabled, 'aria-label': action.label + (action.badge ? ' (nye)' : '') },
        h(Icon, { name: action.icon }), action.badge && h('span', { className: 'mj-iconbtn-dot', 'aria-hidden': true }))));
}

function GreetingArt() {
  return h('svg', { className: 'mj-greet-art', viewBox: '0 0 64 64', 'aria-hidden': true },
    h('rect', { className: 'mj-art-a', x: 0, y: 8, width: 56, height: 56, rx: 16 }),
    h('circle', { className: 'mj-art-b', cx: 44, cy: 20, r: 20 }),
    h('rect', { className: 'mj-art-c', x: 12, y: 36, width: 24, height: 16, rx: 8 }));
}
export interface GreetingCardProps { firstName: string; job: string; workplace: string; agreement: string; loading?: boolean; onChangeAgreement?: () => void }
export function GreetingCard({ firstName, job, workplace, agreement, loading }: GreetingCardProps) {
  if (loading) {
    return h('section', { className: 'mj-greet', 'aria-busy': true, 'aria-label': 'Henter din profil' },
      h('div', { className: 'mj-greet-body mj-stack' }, h(Skeleton, { width: '55%', height: 28 }), h(Skeleton, { width: '80%' }), h(Skeleton, { width: 140, height: 24 })));
  }
  return h('section', { className: 'mj-greet', 'aria-labelledby': 'greet-title' },
    h('div', { className: 'mj-greet-body' },
      h('h2', { id: 'greet-title', className: 'text-title-1' }, 'Hej ' + firstName),
      h('p', { className: 'text-body-sm mj-muted' }, job + ' · ' + workplace),
      h(Badge, { tone: 'primary', icon: 'scale' }, agreement)),
    h(GreetingArt));
}

export interface FeatureTileProps { icon: string; title: string; description: string; status?: { tone: Status; text: string }; disabled?: boolean; focused?: boolean; onClick?: () => void }
export function FeatureTile({ icon, title, description, status, disabled, focused, onClick }: FeatureTileProps) {
  return h('button', { type: 'button', className: cx('mj-tile mj-focusable', focused && 'is-focus'), disabled, onClick },
    h('span', { className: 'mj-tile-top' }, h('span', { className: 'mj-tile-ico' }, h(Icon, { name: icon })), status && h(Badge, { tone: status.tone }, status.text)),
    h('span', null, h('span', { className: 'mj-tile-title text-title-3' }, title), h('span', { className: 'mj-tile-desc text-body-sm mj-muted' }, description)));
}

export interface PromoBannerProps { title: string; text: string; actionLabel: string; icon?: string; disabled?: boolean; onClick?: () => void }
export function PromoBanner({ title, text, actionLabel, icon = 'sparkles', disabled, onClick }: PromoBannerProps) {
  return h('section', { className: 'mj-promo' },
    h('span', { className: 'mj-promo-ico' }, h(Icon, { name: icon, size: 26 })),
    h('div', { className: 'mj-promo-body' }, h('h3', { className: 'text-title-3' }, title), h('p', { className: 'text-body-sm' }, text)),
    h(Button, { variant: 'navy', size: 'sm', onClick, disabled }, actionLabel));
}

export type TabId = 'home' | 'ai' | 'me';
export interface BottomTabBarProps { active: TabId; onChange?: (tab: TabId) => void; focusedTab?: TabId }
export function BottomTabBar({ active, onChange, focusedTab }: BottomTabBarProps) {
  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'home', label: 'Hjem', icon: 'house' }, { id: 'ai', label: 'AI', icon: 'sparkles' }, { id: 'me', label: 'Mig', icon: 'user' }];
  return h('nav', { className: 'mj-tabbar', 'aria-label': 'Hovedmenu' },
    h('ul', null, tabs.map((tab) => h('li', { key: tab.id },
      h('button', {
        type: 'button', className: cx('mj-tab mj-focusable', tab.id === 'ai' && 'mj-tab-ai', focusedTab === tab.id && 'is-focus'),
        'aria-current': active === tab.id ? 'page' : undefined, onClick: () => onChange && onChange(tab.id),
      },
        tab.id === 'ai' ? h('span', { className: 'mj-tab-bubble' }, h(Icon, { name: tab.icon, size: 26 })) : h(Icon, { name: tab.icon, size: 26 }),
        h('span', { className: 'mj-tab-label' }, tab.label))))));
}

/* ---------- Upload ---------- */
export type UploadStatus = 'idle' | 'uploading' | 'reading' | 'done' | 'error';
export interface UploadCardProps {
  title: string; description: string; status: UploadStatus; fileName?: string; progress?: number; error?: string;
  readingText?: string; doneText?: string; disabled?: boolean; onSelect?: () => void; onRetry?: () => void; children?: Children;
}
export function UploadCard({ title, description, status, fileName, progress = 0, error, readingText = 'AI læser dit dokument…', doneText = 'Færdig', disabled, onSelect, onRetry, children }: UploadCardProps) {
  const stepIndex: number = status === 'uploading' ? 0 : status === 'reading' ? 1 : status === 'done' ? 3 : -1;
  const steps: string[] = ['Uploader', 'AI læser', 'Færdig'];
  return h('section', { className: 'mj-card mj-upload', 'aria-busy': status === 'uploading' || status === 'reading' || undefined },
    h('div', null, h('h2', { className: 'text-title-2', style: { margin: 0 } }, title), h('p', { className: 'text-body-sm mj-muted', style: { margin: '4px 0 0' } }, description)),
    status === 'idle' && h('div', { className: 'mj-upload-drop' },
      h('span', { className: 'mj-tile-ico' }, h(Icon, { name: 'upload', size: 28 })),
      h('p', { className: 'text-body-sm mj-muted', style: { margin: 0 } }, 'PDF eller billede · højst 10 MB'),
      h(Button, { icon: 'file-text', onClick: onSelect, disabled }, 'Vælg fil')),
    (status === 'uploading' || status === 'reading' || status === 'done') && h(Fragment, null,
      h('div', { className: 'mj-upload-file' },
        h('span', { className: 'mj-tile-ico' }, h(Icon, { name: status === 'done' ? 'circle-check' : 'file-text' })),
        h('div', null,
          h('span', { className: 'mj-upload-name' }, fileName),
          h('span', { className: 'text-body-sm mj-muted', role: 'status' }, status === 'uploading' ? 'Uploader… ' + Math.round(progress) + ' %' : status === 'reading' ? readingText : doneText))),
      status !== 'done' && h(Progress, { value: status === 'uploading' ? progress : 100, label: status === 'uploading' ? 'Uploader' : readingText }),
      h('ol', { className: 'mj-steps', 'aria-label': 'Trin' }, steps.map((stepLabel: string, index: number) => h('li', {
        key: stepLabel, className: cx('mj-step', index < stepIndex && 'is-done', index === stepIndex && 'is-active', stepIndex === 3 && 'is-done'),
        'aria-current': index === stepIndex ? 'step' : undefined,
      }, h('span', { className: 'mj-step-dot' }, index < stepIndex || stepIndex === 3 ? h(Icon, { name: 'check', size: 16, strokeWidth: 3 }) : index === stepIndex ? h(Icon, { name: 'loader-circle', size: 16, className: 'mj-spin' }) : index + 1), stepLabel)))),
    status === 'error' && h(Fragment, null,
      h('p', { className: 'mj-error', role: 'alert' }, h(Icon, { name: 'circle-alert', size: 18 }), error || 'Vi kunne ikke læse filen. Prøv igen med en tydelig PDF eller et skarpt billede.'),
      h(Button, { variant: 'outline', icon: 'refresh-cw', onClick: onRetry }, 'Prøv igen')),
    children);
}

export interface MaskedFieldProps { label: string; maskedValue: string; badgeText?: string }
export function MaskedField({ label, maskedValue, badgeText = 'Skjult for AI' }: MaskedFieldProps) {
  return h('div', { className: 'mj-masked' },
    h(Icon, { name: 'lock', size: 20, className: 'mj-muted' }),
    h('div', { className: 'mj-masked-body' }, h('span', { className: 'mj-masked-label' }, label), h('span', { className: 'mj-masked-value', 'aria-label': label + ' er skjult' }, maskedValue)),
    h(Badge, { tone: 'primary', icon: 'eye-off' }, badgeText));
}

/* ---------- Terms ---------- */
export interface FactRowProps { label: string; value: string; source: string; edited?: boolean; disabled?: boolean; loading?: boolean; focused?: boolean; onEdit?: () => void }
export function FactRow({ label, value, source, edited, disabled, loading, focused, onEdit }: FactRowProps) {
  if (loading) {
    return h('li', { className: 'mj-fact', 'aria-busy': true }, h('div', { className: 'mj-fact-body mj-stack', style: { gap: 6 } }, h(Skeleton, { width: '40%', height: 14 }), h(Skeleton, { width: '65%', height: 20 }), h(Skeleton, { width: '50%', height: 12 })));
  }
  return h('li', { className: cx('mj-fact', disabled && 'is-disabled') },
    h('div', { className: 'mj-fact-body' },
      h('span', { className: 'mj-fact-label' }, label),
      h('span', { className: 'mj-fact-value mj-num' }, value),
      h('span', { className: 'mj-fact-source' }, h(Icon, { name: 'file-search', size: 14 }), source, edited && h(Badge, { tone: 'info', icon: 'pencil' }, 'Rettet af dig'))),
    h(Button, { variant: 'ghost', size: 'sm', icon: 'pencil', onClick: onEdit, disabled, className: focused ? 'is-focus' : undefined }, h('span', null, 'Ret', h('span', { className: 'mj-sr' }, ' ' + label.toLowerCase()))));
}
export function FactList({ children, label }: { children?: Children; label?: string }) {
  return h('ul', { className: 'mj-facts', 'aria-label': label }, children);
}

/* ---------- Shifts ---------- */
export interface ShiftListItemProps { date: string; start: string; end: string; pauseMinutes?: number; hours: number; expectedPay: number; supplement?: string; disabled?: boolean; focused?: boolean; onClick?: () => void }
export function ShiftListItem({ date, start, end, pauseMinutes = 0, hours, expectedPay, supplement, disabled, focused, onClick }: ShiftListItemProps) {
  const [, , day] = date.split('-').map(Number);
  return h('button', { type: 'button', className: cx('mj-shift mj-focusable', focused && 'is-focus'), disabled, onClick, 'aria-label': weekdayShort(date) + ' ' + formatDate(date) + ', ' + start + ' til ' + end + ', ' + formatHours(hours) + ' timer, forventet ' + formatKr(expectedPay) },
    h('span', { className: 'mj-shift-date' }, h('b', null, day), h('span', null, weekdayShort(date))),
    h('span', { className: 'mj-shift-body' },
      h('span', { className: 'text-title-3 mj-num', style: { display: 'block' } }, start + '–' + end),
      h('span', { className: 'mj-shift-meta text-body-sm mj-muted' },
        h('span', { className: 'mj-num' }, formatHours(hours) + ' t'), pauseMinutes > 0 && h('span', null, '· ' + pauseMinutes + ' min. pause'), supplement && h(Badge, { tone: 'primary', icon: 'plus' }, supplement))),
    h('span', { className: 'mj-shift-pay' }, h('span', { className: 'text-amount-sm mj-num', style: { display: 'block' } }, formatKr(expectedPay)), h('span', { className: 'text-body-sm mj-muted' }, 'forventet')),
    h(Icon, { name: 'chevron-right', size: 20, className: 'mj-muted' }));
}

export interface MonthCalendarProps { year: number; month: number; shiftDays: number[]; selectedDay?: number; today?: number; disabled?: boolean; focusedDay?: number; onSelect?: (day: number) => void; onPrev?: () => void; onNext?: () => void }
export function MonthCalendar({ year, month, shiftDays, selectedDay, today, disabled, focusedDay, onSelect, onPrev, onNext }: MonthCalendarProps) {
  const firstWeekday: number = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth: number = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [];
  for (let blank = 0; blank < firstWeekday; blank++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  const monthName: string = MONTHS_LONG[month - 1];
  return h('section', { className: 'mj-card mj-cal', 'aria-label': 'Kalender for ' + monthName + ' ' + year },
    h('div', { className: 'mj-cal-head' },
      h('button', { type: 'button', className: 'mj-iconbtn mj-focusable', 'aria-label': 'Forrige måned', onClick: onPrev, disabled }, h(Icon, { name: 'chevron-left' })),
      h('h3', { className: 'text-title-3', 'aria-live': 'polite' }, monthName + ' ' + year),
      h('button', { type: 'button', className: 'mj-iconbtn mj-focusable', 'aria-label': 'Næste måned', onClick: onNext, disabled }, h(Icon, { name: 'chevron-right' }))),
    h('div', { className: 'mj-cal-grid', role: 'grid' },
      ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'].map((weekdayName: string) => h('span', { key: weekdayName, className: 'mj-cal-wd', 'aria-hidden': true }, weekdayName)),
      cells.map((day: number | null, index: number) => day === null ? h('span', { key: 'blank' + index }) : h('button', {
        key: day, type: 'button', disabled,
        className: cx('mj-cal-day mj-focusable mj-num', shiftDays.indexOf(day) >= 0 && 'has-shift', today === day && 'is-today', focusedDay === day && 'is-focus'),
        'aria-pressed': selectedDay === day, onClick: () => onSelect && onSelect(day),
        'aria-label': day + '. ' + monthName + (shiftDays.indexOf(day) >= 0 ? ', vagt' : '') + (today === day ? ', i dag' : ''),
      }, day))),
    h('div', { className: 'mj-cal-legend' }, h('span', null, h('i'), 'Vagt'), h('span', null, '▢ I dag')));
}

export interface ShiftFormValues { date: string; start: string; end: string; pause: string }
export interface ShiftFormProps { values: ShiftFormValues; errors?: Partial<Record<keyof ShiftFormValues, string>>; summary?: string; submitting?: boolean; disabled?: boolean; onChange?: (values: ShiftFormValues) => void; onSubmit?: () => void; onCancel?: () => void }
export function ShiftForm({ values, errors = {}, summary, submitting, disabled, onChange, onSubmit, onCancel }: ShiftFormProps) {
  const setField = (fieldName: keyof ShiftFormValues) => onChange ? (fieldValue: string) => onChange({ ...values, [fieldName]: fieldValue }) : undefined;
  return h('form', { className: 'mj-card mj-form', noValidate: true, onSubmit: (event: any) => { event.preventDefault(); onSubmit && onSubmit(); }, 'aria-labelledby': 'shiftform-title' },
    h('h2', { id: 'shiftform-title', className: 'text-title-2', style: { margin: 0 } }, 'Tilføj vagt'),
    h(TextField, { label: 'Dato', type: 'date', value: values.date, error: errors.date, disabled, onChange: setField('date') }),
    h('div', { className: 'mj-form-grid' },
      h(TextField, { label: 'Start', type: 'time', value: values.start, error: errors.start, disabled, onChange: setField('start') }),
      h(TextField, { label: 'Slut', type: 'time', value: values.end, error: errors.end, disabled, onChange: setField('end') })),
    h(TextField, { label: 'Pause (minutter)', inputMode: 'numeric', value: values.pause, error: errors.pause, hint: 'Pausen er betalt i din kontrakt.', disabled, onChange: setField('pause') }),
    summary && h('div', { className: 'mj-form-summary text-label', role: 'status' }, h('span', null, 'Forventet løn'), h('span', { className: 'mj-num' }, summary)),
    h('div', { className: 'mj-form-actions' },
      h(Button, { type: 'submit', size: 'lg', block: true, loading: submitting, disabled }, submitting ? 'Gemmer…' : 'Gem vagt'),
      h(Button, { variant: 'ghost', block: true, onClick: onCancel, disabled: submitting }, 'Annuller')));
}

/* ---------- Pay check ---------- */
export interface PayCheckSummaryProps { month: string; expected: number; paid: number; issueCount: number; loading?: boolean }
export function PayCheckSummary({ month, expected, paid, issueCount, loading }: PayCheckSummaryProps) {
  if (loading) {
    return h('section', { className: 'mj-card mj-pay', 'aria-busy': true, 'aria-label': 'Tjekker din løn' },
      h('div', { className: 'mj-pay-status' }, h(Skeleton, { width: 44, height: 44, radius: '9999px' }), h('div', { className: 'mj-stack', style: { flex: 1, gap: 8 } }, h(Skeleton, { width: '80%', height: 24 }), h(Skeleton, { width: '50%' }))),
      h('p', { className: 'text-body-sm mj-muted', role: 'status', style: { margin: 0 } }, 'Vi sammenligner lønsedlen med dine vagter og din overenskomst…'));
  }
  const difference: number = Math.round((expected - paid) * 100) / 100;
  const hasIssues: boolean = issueCount > 0;
  const headline: string = hasIssues ? 'Vi fandt ' + issueCount + ' mulig' + (issueCount === 1 ? '' : 'e') + ' fejl – i alt ' + formatKr(difference) : 'Din løn ser rigtig ud';
  return h('section', { className: 'mj-card mj-pay', 'aria-labelledby': 'pay-title' },
    h('div', { className: 'mj-pay-status' },
      h('span', { className: cx('mj-pay-ico', hasIssues ? 'tone-warning' : 'tone-success') }, h(Icon, { name: hasIssues ? 'triangle-alert' : 'circle-check' })),
      h('div', null, h('p', { className: 'text-label mj-muted', style: { margin: 0 } }, 'Løntjek · ' + month), h('h2', { id: 'pay-title', className: 'text-title-2' }, headline))),
    h('dl', { className: 'mj-num' },
      h('dt', null, 'Forventet ud fra dine vagter'), h('dd', null, formatKr(expected)),
      h('dt', null, 'Udbetalt på lønsedlen'), h('dd', null, formatKr(paid)),
      h('dt', { className: 'mj-pay-diff' }, hasIssues ? 'Du mangler måske' : 'Forskel'), h('dd', { className: 'mj-pay-diff text-amount', style: { color: hasIssues ? 'var(--warning)' : 'var(--success)' } }, formatKr(difference))),
    hasIssues && h(Badge, { tone: 'warning' }, issueCount + ' mulig' + (issueCount === 1 ? '' : 'e') + ' fejl'));
}

export interface DeviationDetail { label: string; value: string }
export interface DeviationCardProps { title: string; date: string; amount: number; details: DeviationDetail[]; explanation?: string; defaultExpanded?: boolean; expanded?: boolean; disabled?: boolean; focused?: boolean; onToggle?: (expanded: boolean) => void; children?: Children }
export function DeviationCard({ title, date, amount, details, explanation, defaultExpanded = false, expanded, disabled, focused, onToggle, children }: DeviationCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded: boolean = expanded !== undefined ? expanded : internalExpanded;
  const panelId: string = useId();
  const toggle = () => { setInternalExpanded(!isExpanded); if (onToggle) onToggle(!isExpanded); };
  return h('section', { className: 'mj-card mj-dev' },
    h('button', { type: 'button', className: cx('mj-dev-head mj-focusable', focused && 'is-focus'), 'aria-expanded': isExpanded, 'aria-controls': panelId, onClick: toggle, disabled },
      h('span', { className: 'mj-dev-ico' }, h(Icon, { name: 'triangle-alert', size: 22 })),
      h('span', { className: 'mj-dev-body' },
        h('span', { className: 'text-label mj-dev-kicker', style: { display: 'block', color: 'var(--warning)' } }, 'Mulig fejl · ' + date),
        h('span', { className: 'text-title-3', style: { display: 'block' } }, title)),
      h('span', { className: 'text-amount-sm mj-num' }, formatKr(amount)),
      h(Icon, { name: 'chevron-down', size: 20, className: 'mj-dev-chev' })),
    isExpanded && h('div', { className: 'mj-dev-detail', id: panelId },
      h('dl', { className: 'mj-num' }, details.map((detail: DeviationDetail) => h(Fragment, { key: detail.label }, h('dt', null, detail.label), h('dd', null, detail.value)))),
      explanation && h('p', { className: 'text-body-sm' }, explanation),
      children));
}

/* ---------- Chat ---------- */
export interface ChatBubbleProps { from: 'user' | 'ai'; children?: Children; source?: string; typing?: boolean; error?: string; onRetry?: () => void }
export function ChatBubble({ from, children, source, typing, error, onRetry }: ChatBubbleProps) {
  const isAi: boolean = from === 'ai';
  return h('div', { className: cx('mj-bubble-row', 'from-' + from) },
    isAi && h('span', { className: 'mj-avatar', 'aria-hidden': true }, h(Icon, { name: 'sparkles', size: 18 })),
    h('div', { className: cx('mj-bubble', isAi ? 'mj-bubble-ai' : 'mj-bubble-user') },
      h('span', { className: 'mj-sr' }, isAi ? 'Jobbuddy AI siger:' : 'Du skrev:'),
      typing ? h('span', { className: 'mj-dots', role: 'status', 'aria-label': 'AI skriver' }, h('span'), h('span'), h('span'))
        : error ? h('div', null, h('p', { className: 'mj-bubble-error', role: 'alert' }, h(Icon, { name: 'wifi-off', size: 20 }), error), onRetry && h(Button, { variant: 'ghost', size: 'sm', icon: 'refresh-cw', onClick: onRetry }, 'Prøv igen'))
          : h('p', null, children),
      isAi && source && !typing && !error && h('span', { className: 'mj-bubble-source' }, h(Icon, { name: 'file-search', size: 14 }), source)));
}

export interface SuggestedQuestionChipsProps { questions: string[]; disabled?: boolean; focusedIndex?: number; onSelect?: (question: string) => void }
export function SuggestedQuestionChips({ questions, disabled, focusedIndex, onSelect }: SuggestedQuestionChipsProps) {
  return h('div', null,
    h('p', { className: 'text-label mj-muted', style: { margin: '0 0 8px' }, id: 'chips-label' }, 'Forslag til spørgsmål'),
    h('ul', { className: 'mj-chips', 'aria-labelledby': 'chips-label' }, questions.map((question: string, index: number) => h('li', { key: question },
      h('button', { type: 'button', className: cx('mj-chip mj-focusable', focusedIndex === index && 'is-focus'), disabled, onClick: () => onSelect && onSelect(question) },
        h(Icon, { name: 'message-circle-question', size: 18 }), question)))));
}

export interface ChatInputProps { value: string; remaining?: number; total?: number; disabled?: boolean; sending?: boolean; focused?: boolean; onChange?: (value: string) => void; onSend?: () => void }
export function ChatInput({ value, remaining, total, disabled, sending, focused, onChange, onSend }: ChatInputProps) {
  const inputId: string = useId();
  const isEmpty: boolean = value.trim().length === 0;
  const outOfQuestions: boolean = remaining === 0;
  return h('form', { className: 'mj-chatinput', onSubmit: (event: any) => { event.preventDefault(); if (!isEmpty && onSend) onSend(); } },
    h('label', { className: 'mj-label', htmlFor: inputId }, 'Dit spørgsmål'),
    h('div', { className: 'mj-chatinput-row' },
      h('textarea', { id: inputId, rows: 1, value, disabled: disabled || outOfQuestions, className: cx('mj-focusable', focused && 'is-focus'), placeholder: outOfQuestions ? 'Du har brugt dine gratis spørgsmål' : 'Skriv fx: Hvornår skal jeg have pause?', onChange: (event: any) => onChange && onChange(event.target.value), readOnly: !onChange }),
      h('button', { type: 'submit', className: 'mj-send mj-focusable', disabled: disabled || outOfQuestions || isEmpty || sending, 'aria-label': 'Send spørgsmål' },
        h(Icon, { name: sending ? 'loader-circle' : 'send', size: 22, className: sending ? 'mj-spin' : undefined }))),
    remaining !== undefined && h('div', { className: 'mj-chatinput-meta' },
      h('span', { className: 'text-body-sm', style: { color: outOfQuestions ? 'var(--warning)' : 'var(--muted-foreground)', fontWeight: outOfQuestions ? 600 : 400 } },
        outOfQuestions ? 'Ingen spørgsmål tilbage denne måned' : remaining + ' af ' + total + ' spørgsmål tilbage')));
}

export function AiDisclaimer({ boxed = false }: { boxed?: boolean }) {
  return h('p', { className: cx('mj-disclaimer', boxed && 'is-boxed') }, h(Icon, { name: 'info', size: 16 }), 'Jeg er en AI og giver vejledning, ikke juridisk rådgivning.');
}

/* ---------- Escalation & consent ---------- */
export interface EscalationCardProps { title?: string; text: string; shareLabel?: string; laterLabel?: string; disabled?: boolean; onShare?: () => void; onLater?: () => void }
export function EscalationCard({ title = 'Det her bør du få hjælp til.', text, shareLabel = 'Del min sag', laterLabel = 'Ikke nu', disabled, onShare, onLater }: EscalationCardProps) {
  return h('section', { className: 'mj-esc', 'aria-labelledby': 'esc-title' },
    h('div', { className: 'mj-esc-head' },
      h('span', { className: 'mj-esc-ico' }, h(Icon, { name: 'life-buoy' })),
      h('div', null, h('h3', { id: 'esc-title', className: 'text-title-3' }, title), h('p', { className: 'text-body' }, text))),
    h('p', { className: 'text-body-sm mj-muted', style: { margin: 0 } }, 'Du ser præcis, hvad der deles, før noget bliver sendt.'),
    h('div', { className: 'mj-esc-actions' }, h(Button, { icon: 'send', onClick: onShare, disabled }, shareLabel), h(Button, { variant: 'ghost', onClick: onLater, disabled }, laterLabel)));
}

export interface SharedItem { label: string; value: string }
export interface ConsentSheetProps { open: boolean; recipient: string; shared: SharedItem[]; notShared: string[]; sending?: boolean; inline?: boolean; onConfirm?: () => void; onCancel?: () => void }
export function ConsentSheet({ open, recipient, shared, notShared, sending, inline, onConfirm, onCancel }: ConsentSheetProps) {
  if (!open) return null;
  return h('div', { className: cx('mj-sheet-wrap', !inline && 'is-fixed') },
    h('div', { className: 'mj-overlay', onClick: onCancel, 'aria-hidden': true }),
    h('div', { className: 'mj-sheet', role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'consent-title' },
      h('div', { className: 'mj-sheet-grab', 'aria-hidden': true }),
      h('h2', { id: 'consent-title', className: 'text-title-2' }, 'Del din sag med ' + recipient),
      h('p', { className: 'text-body-sm mj-muted', style: { margin: '0 0 16px' } }, 'Det her sender vi. Intet bliver delt, før du trykker på knappen.'),
      h('ul', { className: 'mj-sheet-list' }, shared.map((item: SharedItem) => h('li', { key: item.label },
        h(Icon, { name: 'check', size: 20, className: 'mj-muted', strokeWidth: 2.5 }), h('div', null, h('strong', null, item.label), h('span', { className: 'text-body-sm mj-muted' }, item.value))))),
      h('h3', { className: 'text-label mj-sheet-sub' }, 'Det deler vi ikke'),
      h('ul', { className: 'mj-sheet-list' }, notShared.map((itemLabel: string) => h('li', { key: itemLabel, className: 'is-excluded' },
        h(Icon, { name: 'eye-off', size: 20, className: 'mj-muted' }), h('div', null, h('strong', null, itemLabel))))),
      h('div', { className: 'mj-form-actions' },
        h(Button, { size: 'lg', block: true, icon: 'send', loading: sending, onClick: onConfirm }, sending ? 'Sender…' : 'Del med ' + recipient),
        h(Button, { variant: 'ghost', block: true, onClick: onCancel, disabled: sending }, 'Annuller'))));
}

/* ---------- Settings ---------- */
export interface ConsentToggleProps { label: string; description: string; checked: boolean; disabled?: boolean; focused?: boolean; onChange?: (checked: boolean) => void }
export function ConsentToggle({ label, description, checked, disabled, focused, onChange }: ConsentToggleProps) {
  const switchId: string = useId();
  return h('div', { className: cx('mj-consent', disabled && 'is-disabled') },
    h('div', { className: 'mj-consent-body' },
      h('label', { htmlFor: switchId, className: 'text-title-3' }, label),
      h('p', { className: 'text-body-sm mj-muted', id: switchId + '-desc' }, description),
      h(Badge, { tone: checked ? 'success' : 'neutral', icon: checked ? 'circle-check' : 'x' }, checked ? 'Til' : 'Fra')),
    h('span', { className: 'mj-switch-hit' },
      h('button', { id: switchId, type: 'button', role: 'switch', 'aria-checked': checked, 'aria-describedby': switchId + '-desc', disabled, className: cx('mj-switch mj-focusable', focused && 'is-focus'), onClick: () => onChange && onChange(!checked) })));
}

export interface PlanCardProps { name: string; price: string; features: string[]; current?: boolean; usage?: { used: number; total: number; unit: string }; ctaLabel?: string; disabled?: boolean; onSelect?: () => void }
export function PlanCard({ name, price, features, current, usage, ctaLabel, disabled, onSelect }: PlanCardProps) {
  return h('section', { className: cx('mj-card mj-plan', current && 'is-current'), 'aria-label': 'Abonnement ' + name },
    h('div', { className: 'mj-plan-head' },
      h('div', null, h('h3', { className: 'text-title-2' }, name), h('span', { className: 'text-body mj-num' }, price)),
      current && h(Badge, { tone: 'primary', icon: 'circle-check' }, 'Dit abonnement')),
    usage && h('div', { className: 'mj-plan-usage' },
      h('span', { className: 'text-label mj-num' }, (usage.total - usage.used) + ' af ' + usage.total + ' ' + usage.unit + ' tilbage'),
      h(Progress, { value: ((usage.total - usage.used) / usage.total) * 100, label: usage.unit + ' tilbage' })),
    h('ul', null, features.map((feature: string) => h('li', { key: feature, className: 'text-body-sm' }, h(Icon, { name: 'check', size: 18, strokeWidth: 2.5 }), feature))),
    ctaLabel && h(Button, { variant: current ? 'outline' : 'primary', block: true, onClick: onSelect, disabled }, ctaLabel));
}

/* ---------- Shared states ---------- */
export interface EmptyStateProps { icon?: string; title: string; text: string; actionLabel?: string; actionIcon?: string; onAction?: () => void }
export function EmptyState({ icon = 'inbox', title, text, actionLabel, actionIcon = 'plus', onAction }: EmptyStateProps) {
  return h('section', { className: 'mj-state' },
    h('span', { className: 'mj-state-ico' }, h(Icon, { name: icon, size: 30 })),
    h('h3', { className: 'text-title-3' }, title), h('p', { className: 'text-body-sm mj-muted' }, text),
    actionLabel && h(Button, { icon: actionIcon, onClick: onAction }, actionLabel));
}

export interface LoadingSkeletonProps { variant?: 'list' | 'card' | 'text'; rows?: number; label?: string }
export function LoadingSkeleton({ variant = 'list', rows = 3, label = 'Henter…' }: LoadingSkeletonProps) {
  const rowIndexes: number[] = Array.from({ length: rows }, (_unused: unknown, index: number) => index);
  return h('div', { role: 'status', 'aria-busy': true, className: 'mj-stack' },
    h('span', { className: 'mj-sr' }, label),
    variant === 'card' ? h('div', { className: 'mj-card mj-card-pad mj-stack' }, h(Skeleton, { width: '60%', height: 24 }), h(Skeleton, {}), h(Skeleton, { width: '75%' }))
      : variant === 'text' ? rowIndexes.map((index: number) => h(Skeleton, { key: index, width: index === rows - 1 ? '60%' : '100%' }))
        : rowIndexes.map((index: number) => h('div', { key: index, className: 'mj-card mj-card-pad', style: { display: 'flex', gap: 12, alignItems: 'center' } },
          h(Skeleton, { width: 52, height: 52, radius: '12px' }), h('div', { className: 'mj-stack', style: { flex: 1, gap: 8 } }, h(Skeleton, { width: '50%', height: 18 }), h(Skeleton, { width: '70%', height: 14 })))));
}

export interface ErrorStateProps { title?: string; text: string; retryLabel?: string; retrying?: boolean; onRetry?: () => void }
export function ErrorState({ title = 'Noget gik galt', text, retryLabel = 'Prøv igen', retrying, onRetry }: ErrorStateProps) {
  return h('section', { className: 'mj-state', role: 'alert' },
    h('span', { className: 'mj-state-ico tone-danger' }, h(Icon, { name: 'circle-alert', size: 30 })),
    h('h3', { className: 'text-title-3' }, title), h('p', { className: 'text-body-sm mj-muted' }, text),
    onRetry && h(Button, { variant: 'outline', icon: 'refresh-cw', loading: retrying, onClick: onRetry }, retryLabel));
}

/* ---------- Example data (fictional, shared by every screen) ---------- */
export const exampleData = {
  user: { firstName: 'Maja', age: 17, job: 'Butiksmedarbejder', workplace: 'Torvebutikken', agreement: 'HK Handel – Butik' },
  terms: [
    { label: 'Timeløn', value: '92,50 kr.', source: 'Din kontrakt, § 3' },
    { label: 'Aftentillæg (hverdage efter kl. 18)', value: '30,00 kr./t', source: 'Overenskomst' },
    { label: 'Lørdagstillæg (efter kl. 15)', value: '40,00 kr./t', source: 'Overenskomst' },
    { label: 'Søndags- og helligdagstillæg', value: '45,00 kr./t', source: 'Overenskomst' },
    { label: 'Pause', value: '30 min. ved mere end 4,5 timer', source: 'Din kontrakt, § 5' },
    { label: 'Opsigelse', value: 'Du kan sige op med 14 dages varsel', source: 'Din kontrakt, § 8' },
    { label: 'Sygdom', value: 'Meld dig syg til din leder inden vagten', source: 'Din kontrakt, § 7' },
  ],
  shifts: [
    { date: '2026-10-06', start: '16:00', end: '20:00', pauseMinutes: 0, hours: 4, expectedPay: 430, supplement: 'Aften 2 t' },
    { date: '2026-10-08', start: '16:00', end: '20:00', pauseMinutes: 0, hours: 4, expectedPay: 430, supplement: 'Aften 2 t' },
    { date: '2026-10-10', start: '09:00', end: '15:00', pauseMinutes: 30, hours: 6, expectedPay: 555 },
    { date: '2026-10-11', start: '10:00', end: '16:00', pauseMinutes: 30, hours: 6, expectedPay: 825, supplement: 'Søndag 6 t' },
    { date: '2026-10-14', start: '15:30', end: '21:00', pauseMinutes: 30, hours: 5.5, expectedPay: 598.75, supplement: 'Aften 3 t' },
  ],
  totals: { hours: 25.5, expectedPay: 2838.75 },
  payslip: { month: 'oktober 2026', hours: 24, eveningHours: 7, sundayHours: 0, grossPay: 2430 },
  deviations: [
    { title: '1,5 time mangler', date: 'ons. 14. okt.', amount: 138.75, details: [{ label: 'Dine vagter', value: '5,5 t' }, { label: 'På lønsedlen', value: '4 t' }, { label: 'Mangler', value: '1,5 t × 92,50 kr.' }] },
    { title: 'Søndagstillæg mangler', date: 'søn. 11. okt.', amount: 270, details: [{ label: 'Søndagstimer', value: '6 t' }, { label: 'På lønsedlen', value: '0 t' }, { label: 'Mangler', value: '6 t × 45,00 kr.' }] },
  ],
  questions: ['Har jeg ret til pause på min vagt på 5,5 timer?', 'Må min chef bede mig finde en afløser, når jeg er syg?', 'Hvad får jeg i tillæg om søndagen?'],
};
