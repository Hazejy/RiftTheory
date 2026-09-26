import { DialogContent, DialogHeader, DialogTitle } from "../common/Dialog";
import { buttonVariants } from "../common/Button";

type Props = { open: boolean };

export function DesktopAppDialog(props: Props) {
    return (
        <DialogContent class="max-w-xl" data-open={props.open}>
            <DialogHeader>
                <DialogTitle>RiftTheory desktop app</DialogTitle>
            </DialogHeader>
            <p class="font-body">
                RiftTheory connects to the League client and follows champion
                select. Download the latest Windows installer from the RiftTheory
                release page.
            </p>
            <a
                href="https://github.com/Hazejy/RiftTheory/releases/latest"
                class={buttonVariants({ variant: "primary" })}
                target="_blank"
                rel="noopener noreferrer"
            >
                View RiftTheory releases
            </a>
        </DialogContent>
    );
}
