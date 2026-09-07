import { Component, Match, Switch } from "solid-js";
import { ClientState, useLolClient } from "../../contexts/LolClientContext";
import { Badge } from "../common/Badge";
import { useMedia } from "../../hooks/useMedia";
import { useI18n } from "../../utils/i18n";

type Props = {
    setShowDownloadModal: (show: boolean) => void;
};

export const LolClientStatusBadge: Component<Props> = (props) => {
    const { isDesktop } = useMedia();
    const { clientState, clientError, reconnect } = useLolClient();
    const { t } = useI18n();

    return (
        <Switch>
            <Match when={!isDesktop}>
                <Badge
                    as="button"
                    onClick={() => props.setShowDownloadModal(true)}
                    theme="primary"
                    class="hidden md:block hover:opacity-70 transition"
                >
                    {t("leagueSync")}
                </Badge>
            </Match>
            <Match when={clientState() === ClientState.Disabled}>
                <Badge theme="secondary">{t("syncDisabled")}</Badge>
            </Match>
            <Match when={clientState() === ClientState.Connecting}>
                <Badge theme="secondary">{t("clientConnecting")}</Badge>
            </Match>
            <Match when={clientState() === ClientState.InGame}>
                <Badge theme="primary">{t("clientInGame")}</Badge>
            </Match>
            <Match when={clientState() === ClientState.MainMenu}>
                <Badge theme="primary">{t("clientConnected")}</Badge>
            </Match>
            <Match when={clientState() === ClientState.InChampSelect}>
                <Badge theme="primary">{t("clientChampSelect")}</Badge>
            </Match>
            <Match when={clientState() === ClientState.NotFound}>
                <Badge
                    as="button"
                    onClick={reconnect}
                    theme="secondary"
                    title={`${t("clientNotConnectedHelp")} ${clientError() ?? ""}`}
                >
                    {t("clientNotConnected")}
                </Badge>
            </Match>
        </Switch>
    );
};
