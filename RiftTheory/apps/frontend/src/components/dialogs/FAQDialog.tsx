import { DialogContent, DialogHeader, DialogTitle } from "../common/Dialog";

export function FAQDialog() {
    return (
        <DialogContent class="max-w-2xl">
            <DialogHeader>
                <DialogTitle>RiftTheory FAQ</DialogTitle>
            </DialogHeader>
            <div>
                <h2 class="text-2xl uppercase">What is RiftTheory?</h2>
                <p class="font-body">
                    RiftTheory helps you review League of Legends champion picks,
                    team compositions, matchups and draft plans. The Strategy tab
                    explains the available evidence and explores legal alternatives.
                </p>
            </div>
            <div>
                <h2 class="text-2xl uppercase">How are suggestions calculated?</h2>
                <p class="font-body">
                    The statistical model combines champion, duo and matchup
                    samples. The Strategy tab also considers reviewed champion
                    capabilities and draft order. Ratings are estimates and are
                    not calibrated win probabilities.
                </p>
            </div>
            <div>
                <h2 class="text-2xl uppercase">Where does the data come from?</h2>
                <p class="font-body">
                    The app uses external League statistics and a local curated
                    strategy dataset. Source details and license notices are in
                    the project's third-party notices. Patch and sample coverage
                    are shown alongside the relevant analysis.
                </p>
            </div>
            <div>
                <h2 class="text-2xl uppercase">What does risk level change?</h2>
                <p class="font-body">
                    A higher risk level gives more weight to small samples. It
                    may surface unusual picks, but their estimates are less
                    stable. Lower risk levels favor better supported samples.
                </p>
            </div>
            <p class="font-body">
                Feedback and bug reports: {" "}
                <a
                    href="https://github.com/Hazejy/RiftTheory/issues"
                    class="text-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    RiftTheory issues
                </a>
            </p>
        </DialogContent>
    );
}
