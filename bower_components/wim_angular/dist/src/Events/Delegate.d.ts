declare module WiM.Event {
    class Delegate<T extends EventArgs> {
        private _eventHandlers;
        constructor();
        subscribe(eventHandler: EventHandler<T>): void;
        unsubscribe(eventHandler: EventHandler<T>): void;
        raise(sender: any, e: T): void;
    }
}
