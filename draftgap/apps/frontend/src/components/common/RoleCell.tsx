import { Role } from "@draftgap/core/src/models/Role";
import { RoleIcon } from "../icons/roles/RoleIcon";
import { useI18n } from "../../utils/i18n";

export function RoleCell(props: { role: Role }) {
    const { roleName } = useI18n();
    return (
        <div
            class="flex items-center justify-center"
            aria-label={roleName(props.role)}
            title={roleName(props.role)}
        >
            <RoleIcon role={props.role} class="h-8" />
        </div>
    );
}
