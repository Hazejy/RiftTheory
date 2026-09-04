import { Icon, xMark } from "../icons/RiftIcons";
import { Component, JSX, Show } from "solid-js";
import toast, { Toast as ToastModel } from "solid-toast";

type Props = {
    t: ToastModel;
    title: string;
    content: string;
    icon: {
        path: JSX.Element;
        outline?: boolean;
        mini?: boolean;
    };
    dismissText?: string;
    okText?: string;
    onSubmit?: () => void;
};

export const Toast: Component<Props> = (props) => {
    return (
        <div
            class={`${
                props.t.visible ? "animate-enter" : "animate-leave"
            } relative max-w-sm w-full bg-neutral-800 rounded-lg overflow-hidden ring-1 ring-white/20`}
        >
            <div class="p-2">
                <div class="flex items-start">
                    <div class="shrink-0 pt-[4px]">
                        <Icon path={props.icon} class="w-6 text-neutral-400" />
                    </div>
                    <div class="ml-2 w-0 flex-1 pt-0.5">
                        <p class="text-xl font-medium text-gray-50 uppercase">
                            {props.title}
                        </p>
                        <p class="mt-1 text-gray-300 font-body">
                            {props.content}
                        </p>
                        <Show when={props.dismissText && props.okText}>
                            <div class="mt-1 flex justify-between">
                                <button
                                    type="button"
                                    class="uppercase text-lg font-medium text-neutral-400 hover:text-neutral-300 transition ease-out duration-150"
                                    onClick={() => toast.dismiss(props.t.id)}
                                >
                                    {props.dismissText}
                                </button>
                                <button
                                    type="button"
                                    class="uppercase text-lg font-medium hover:text-neutral-300 transition ease-out duration-150"
                                    onClick={() => {
                                        toast.dismiss(props.t.id);
                                        props.onSubmit?.();
                                    }}
                                >
                                    {props.okText}
                                </button>
                            </div>
                        </Show>
                    </div>
                    <div class="ml-4 shrink-0 flex">
                        <button
                            class="rounded-md inline-flex text-gray-400 hover:text-gray-500 transition ease-out duration-150"
                            onClick={() => toast.dismiss(props.t.id)}
                        >
                            <span class="sr-only">Close</span>
                            <Icon path={xMark} class="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
