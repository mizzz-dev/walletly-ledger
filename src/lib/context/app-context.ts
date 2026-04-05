import { resolveCurrentUser } from "@/lib/auth/current-user";
import { listCategoriesByLedgerId } from "@/lib/categories/service";
import { listHouseholdsByUserId } from "@/lib/households/service";
import { listLedgersByHouseholdId } from "@/lib/ledgers/service";
import { listMembersByHouseholdId } from "@/lib/memberships/service";
import { CategoryOption, HouseholdOption, LedgerOption, MemberOption } from "@/types/domain";
import { resolveSelectedId } from "@/lib/context/selectors";

interface Params {
  householdId?: string;
  ledgerId?: string;
}

export interface AppContextResult {
  userId: string | null;
  isFallbackUser: boolean;
  households: HouseholdOption[];
  ledgers: LedgerOption[];
  categories: CategoryOption[];
  members: MemberOption[];
  currentHouseholdId: string | null;
  currentLedgerId: string | null;
}

export const resolveAppContext = async (params: Params = {}): Promise<AppContextResult> => {
  const currentUser = await resolveCurrentUser();
  if (!currentUser.userId) {
    return {
      userId: null,
      isFallbackUser: false,
      households: [],
      ledgers: [],
      categories: [],
      members: [],
      currentHouseholdId: null,
      currentLedgerId: null,
    };
  }

  const households = await listHouseholdsByUserId(currentUser.userId);
  const currentHouseholdId = resolveSelectedId(params.householdId, households.map((household) => household.id));

  const ledgers = currentHouseholdId ? await listLedgersByHouseholdId(currentHouseholdId) : [];
  const currentLedgerId = resolveSelectedId(params.ledgerId, ledgers.map((ledger) => ledger.id));

  const [categories, members] = await Promise.all([
    currentLedgerId ? listCategoriesByLedgerId(currentLedgerId) : Promise.resolve([]),
    currentHouseholdId ? listMembersByHouseholdId(currentHouseholdId) : Promise.resolve([]),
  ]);

  return {
    userId: currentUser.userId,
    isFallbackUser: currentUser.isFallback,
    households,
    ledgers,
    categories,
    members,
    currentHouseholdId,
    currentLedgerId,
  };
};
