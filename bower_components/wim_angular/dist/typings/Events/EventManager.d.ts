declare module WiM.Event {
    interface IEventManager {
        AddEvent<T extends EventArgs>(EventName: string): any;
        SubscribeToEvent<T extends EventArgs>(EventName: string, handler: EventHandler<T>): any;
        RaiseEvent<T extends EventArgs>(EventName: string, sender: any, args: T): any;
        UnSubscribeToEvent<T extends EventArgs>(EventName: string, handler: EventHandler<T>): any;
    }
}
