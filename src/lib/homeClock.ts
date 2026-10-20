export function getHomeGreeting (date: Date): string {
	const hour = date.getHours();

	if (hour >= 5 && hour < 12) return 'Bom dia, Lucas';
	if (hour >= 12 && hour < 18) return 'Boa tarde, Lucas';
	return 'Boa noite, Lucas';
}

export function formatHomeTime (date: Date): string {
	return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

export function formatHomeDate (date: Date): string {
	return date.toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
}

function twoDigits (value: number): string {
	return value < 10 ? `0${value}` : String(value);
}
