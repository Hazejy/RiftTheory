import { JSX } from "solid-js/jsx-runtime";
import { Icon, loading } from "./RiftIcons";

export function LoadingIcon(props: JSX.HTMLAttributes<SVGSVGElement>) {
    return <Icon path={loading} {...props} />;
}
