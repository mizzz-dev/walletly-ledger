import { MemberOption } from "@/types/domain";

interface MembershipRow {
  id: string;
  user_id: string;
  role: string;
  users: { display_name: string | null } | { display_name: string | null }[];
}

export const formatMemberDisplayName = (displayName: string | null, userId: string): string => {
  if (displayName && displayName.trim()) {
    return displayName;
  }

  return `ユーザー-${userId.slice(0, 8)}`;
};

export const toMemberOptions = (rows: MembershipRow[]): MemberOption[] =>
  rows.map((row) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      membershipId: row.id,
      userId: row.user_id,
      role: row.role,
      name: formatMemberDisplayName(user.display_name, row.user_id),
    };
  });
