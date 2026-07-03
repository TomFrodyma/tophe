import {
	BellIcon,
	BookIcon,
	BriefcaseIcon,
	CakeIcon,
	CalendarIcon,
	CarIcon,
	CoffeeIcon,
	DumbbellIcon,
	FlagIcon,
	GraduationCapIcon,
	HeartIcon,
	HomeIcon,
	MapPinIcon,
	MusicIcon,
	PhoneIcon,
	PlaneIcon,
	PlayIcon,
	SparklesIcon,
	StarIcon,
	StethoscopeIcon,
	UsersIcon,
	UtensilsIcon,
	VideoIcon,
	ZapIcon,
} from "lucide-react";
import type { ComponentType } from "react";

export const CALENDAR_ICONS = {
	calendar: CalendarIcon,
	briefcase: BriefcaseIcon,
	home: HomeIcon,
	users: UsersIcon,
	heart: HeartIcon,
	star: StarIcon,
	flag: FlagIcon,
	sparkles: SparklesIcon,
	book: BookIcon,
	graduationCap: GraduationCapIcon,
	dumbbell: DumbbellIcon,
	coffee: CoffeeIcon,
	utensils: UtensilsIcon,
	cake: CakeIcon,
	music: MusicIcon,
	plane: PlaneIcon,
	car: CarIcon,
	mapPin: MapPinIcon,
	phone: PhoneIcon,
	video: VideoIcon,
	play: PlayIcon,
	bell: BellIcon,
	stethoscope: StethoscopeIcon,
	zap: ZapIcon,
} as const satisfies Record<string, ComponentType<{ className?: string }>>;

export type CalendarIconName = keyof typeof CALENDAR_ICONS;

export const CALENDAR_ICON_NAMES = Object.keys(CALENDAR_ICONS) as CalendarIconName[];

export function isCalendarIcon(value: unknown): value is CalendarIconName {
	return typeof value === "string" && value in CALENDAR_ICONS;
}

export function resolveIcon(value: string | null | undefined) {
	if (isCalendarIcon(value)) return CALENDAR_ICONS[value];
	return null;
}
