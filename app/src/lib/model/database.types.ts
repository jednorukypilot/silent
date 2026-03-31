export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			works: {
				Row: {
					id: string;
					created_at: string;
					displayed: number;
					video_link: string | null;
					name: string;
					description: string | null;
					aspect_ratio: number | null;
					year: number | null;
				};
				Insert: {
					id?: string;
					created_at?: string;
					displayed?: number;
					video_link?: string | null;
					name: string;
					description?: string | null;
					aspect_ratio?: number | null;
					year?: number | null;
				};
				Update: {
					id?: string;
					created_at?: string;
					displayed?: number;
					video_link?: string | null;
					name?: string;
					description?: string | null;
					aspect_ratio?: number | null;
					year?: number | null;
				};
				Relationships: [];
			};
			works_stills: {
				Row: {
					id: string;
					created_at: string;
					work_id: string;
					file_key: string;
					alt: string | null;
					sort_order: number;
				};
				Insert: {
					id?: string;
					created_at?: string;
					work_id: string;
					file_key: string;
					alt?: string | null;
					sort_order: number;
				};
				Update: {
					id?: string;
					created_at?: string;
					work_id?: string;
					file_key?: string;
					alt?: string | null;
					sort_order?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'works_stills_work_id_fkey';
						columns: ['work_id'];
						isOneToOne: false;
						referencedRelation: 'works';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
