declare module WiM.Event {
    class EventHandler<T extends EventArgs> {
        private _handler;
        constructor(handler: {
            (sender: any, e: T): void;
        });
        handle(sender: any, e: T): void;
    }
}
