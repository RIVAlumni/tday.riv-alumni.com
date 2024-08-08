import type { FSMetadata } from '$lib/models';

interface FSUser extends FSMetadata {
	readonly uid: string;
	readonly email: string | null;
	readonly email_verified: boolean;
	readonly display_name: string | null;
	readonly photo_url: string | null;
}

export type { FSUser };
