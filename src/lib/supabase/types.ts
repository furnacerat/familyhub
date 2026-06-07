export type HouseholdRole = "owner" | "adult" | "member" | "child";

export type HouseholdProfile = {
  id: string;
  household_id: string;
  email: string;
  display_name: string;
  role: HouseholdRole;
  budget_access: boolean;
};

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: HouseholdProfile & {
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          household_id: string;
          email: string;
          display_name: string;
          role?: HouseholdRole;
          budget_access?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<HouseholdProfile, "id" | "household_id"> & {
            updated_at: string;
          }
        >;
        Relationships: [];
      };
      household_invites: {
        Row: {
          id: string;
          household_id: string;
          email: string;
          role: HouseholdRole;
          budget_access: boolean;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          email: string;
          role?: HouseholdRole;
          budget_access?: boolean;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          email: string;
          role: HouseholdRole;
          budget_access: boolean;
          accepted_at: string | null;
          expires_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household_for_current_user: {
        Args: {
          household_name: string;
          display_name: string;
        };
        Returns: HouseholdProfile & {
          created_at: string;
          updated_at: string;
        };
      };
      get_household_invite: {
        Args: {
          invite_token: string;
        };
        Returns: {
          email: string;
          role: HouseholdRole;
          budget_access: boolean;
          household_name: string;
          expires_at: string;
          accepted_at: string | null;
        }[];
      };
      accept_household_invite: {
        Args: {
          invite_token: string;
          display_name: string;
        };
        Returns: HouseholdProfile & {
          created_at: string;
          updated_at: string;
        };
      };
    };
    Enums: {
      household_role: HouseholdRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
