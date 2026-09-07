import { ComponentProps, For } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { ROLES } from "@draftgap/core/src/models/Role";
import { RoleIcon } from "../icons/roles/RoleIcon";
import { useDraftAnalysis } from "../../contexts/DraftAnalysisContext";
import { useDraftFilters } from "../../contexts/DraftFiltersContext";
import { cn } from "../../utils/style";
import { useI18n } from "../../utils/i18n";

export function RoleFilter(props: ComponentProps<"span">) {
    const { roleName } = useI18n();
    const { selection, draftFinished } = useDraft();
    const { roleFilter, setRoleFilter } = useDraftFilters();
    const { getFilledRoles } = useDraftAnalysis();

    const filledRoles = () =>
        (selection.team && getFilledRoles(selection.team)) ?? new Set();

    return (
        <span
            {...props}
            class={cn(
                "rt-role-filter isolate inline-flex gap-1.5",
                props.class,
            )}
        >
            <For each={ROLES}>
                {(role, i) => (
                    <button
                        aria-label={roleName(role)}
                        title={roleName(role)}
                        aria-pressed={roleFilter() === role}
                        type="button"
                        class="w-full text-lg relative inline-flex justify-center items-center border text-neutral-300 border-neutral-700 bg-primary px-1 sm:px-3 py-1 font-medium hover:enabled:bg-neutral-800 focus:z-10 disabled:text-neutral-700"
                        classList={{
                            "rounded-r-md": i() === ROLES.length - 1,
                            "rounded-l-md": i() === 0,
                            "-ml-px": i() !== 0,
                            "text-white bg-neutral-700!": roleFilter() === role,
                        }}
                        onClick={() =>
                            roleFilter() === role
                                ? setRoleFilter(undefined)
                                : setRoleFilter(role)
                        }
                        disabled={filledRoles().has(role) || draftFinished()}
                    >
                        <RoleIcon role={role} class="h-7" />
                    </button>
                )}
            </For>
        </span>
    );
}
