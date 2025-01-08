import {fromEvent, Subject} from 'rxjs';
import {BasePlum, IBasePlumOptions} from "../core/BasePlum";
import {isNil} from "lodash-es";
import {KeyboardEventTypes, PointerEventTypes, PointerInfo} from "@babylonjs/core";

export interface IEventManagerOptions extends IBasePlumOptions {
}


export class EventManager extends BasePlum {
    resizeSubject = new Subject<UIEvent>();

    pointerDownSubject = new Subject<PointerInfo>();
    pointerLeftTimeSubject = new Subject<PointerInfo>();
    pointerMiddleDownSubject = new Subject<PointerInfo>();
    pointerRightDownSubject = new Subject<PointerInfo>();


    pointerUpSubject = new Subject<PointerInfo>();
    pointerUpLeftSubject = new Subject<PointerInfo>();
    pointerMiddleUpSubject = new Subject<PointerInfo>();
    pointerRightUpSubject = new Subject<PointerInfo>();

    pointerMoveSubject = new Subject<PointerInfo>();

    pointerWheelSubject = new Subject<PointerInfo>();
    pointerUpWheelSubject = new Subject<PointerInfo>();
    pointerDownWheelSubject = new Subject<PointerInfo>();


    pointerPickSubject = new Subject<PointerInfo>();
    pointerLeftPickSubject = new Subject<PointerInfo>();
    pointerMiddlePickSubject = new Subject<PointerInfo>();
    pointerRightPickSubject = new Subject<PointerInfo>();


    // 当触摸和释放对象而不进行拖动时，将触发 pointertap 事件。
    pointerTapSubject = new Subject<PointerInfo>();
    pointerLeftTapSubject = new Subject<PointerInfo>();
    pointerMiddleTapSubject = new Subject<PointerInfo>();
    pointerRightTapSubject = new Subject<PointerInfo>();


    pointerDoubleTapSubject = new Subject<PointerInfo>();
    pointerLeftDoubleTapSubject = new Subject<PointerInfo>();
    pointerMiddleDoubleTapSubject = new Subject<PointerInfo>();
    pointerRightDoubleTapSubject = new Subject<PointerInfo>();


    //-------------------------
    dragoverSubject = new Subject<DragEvent>();
    dropSubject = new Subject<DragEvent>();

    constructor(options: IEventManagerOptions) {
        super(options);
        const {viewer} = options
        const {scene} = viewer
        this.initializeEventListeners();
        // 监听鼠标悬停事件

        scene.onKeyboardObservable.add((keyboardInfo) => {
            if (keyboardInfo.type === KeyboardEventTypes.KEYDOWN) {
                // console.log(`Key pressed: ${keyboardInfo.event.key}`);
            }
        });

        const dragover = fromEvent<DragEvent>(this.container, 'dragover');
        const drop = fromEvent<DragEvent>(this.container, 'drop');

        dragover.subscribe((event) => {
            event.preventDefault(); // Prevent default behavior
            event.dataTransfer!.dropEffect = 'copy'; // Indicate that files can be copied
            this.dragoverSubject.next(event)
        })

        drop.subscribe((event) => {
            event.preventDefault();
            this.dropSubject.next(event)
        })
        // 鼠标事件
        scene.onPointerObservable.add((value) => {
            const {event, type} = value;
            const {button} = event;
            switch (type) {
                case PointerEventTypes.POINTERDOWN:
                    // console.log('按下',value)
                    switch (button) {
                        case 0:
                            this.pointerLeftTimeSubject.next(value);
                            break;
                        case 1:
                            this.pointerMiddleDownSubject.next(value);
                            break;
                        case 2:
                            this.pointerRightDownSubject.next(value);
                            break;
                    }
                    this.pointerDownSubject.next(value);
                    break;
                case PointerEventTypes.POINTERUP:
                    // console.log("抬起")
                    switch (button) {
                        case 0:
                            this.pointerUpLeftSubject.next(value);
                            break;
                        case 1:
                            this.pointerMiddleUpSubject.next(value);
                            break;
                        case 2:
                            this.pointerRightUpSubject.next(value);
                            break;
                    }
                    this.pointerUpSubject.next(value);
                    // console.log("POINTER UP");
                    break;
                case PointerEventTypes.POINTERMOVE:
                    // console.log("POINTER MOVE");
                    this.pointerMoveSubject.next(value);
                    break;
                case PointerEventTypes.POINTERWHEEL:
                    const {detail} = event;
                    if (isNil(detail)) {
                        return
                    }
                    if (detail < 0) {   //当鼠标滚轮向上滚动时
                        // alert("鼠标滚轮向上滚动");
                        this.pointerUpWheelSubject.next(value);
                    }
                    if (detail > 0) {   //当鼠标滚轮向下滚动时
                        // alert("鼠标滚轮向下滚动");
                        this.pointerDownWheelSubject.next(value);
                    }
                    this.pointerWheelSubject.next(value);
                    break;
                case PointerEventTypes.POINTERPICK:
                    // console.log("POINTER PICK",value);
                    switch (button) {
                        case 0:
                            this.pointerLeftPickSubject.next(value);
                            break;
                        case 1:
                            this.pointerMiddlePickSubject.next(value);
                            break;
                        case 2:
                            this.pointerRightPickSubject.next(value);
                            break;
                    }
                    this.pointerPickSubject.next(value);

                    break;
                case PointerEventTypes.POINTERTAP:
                    // console.log("POINTER TAP");
                    switch (button) {
                        case 0:
                            this.pointerLeftTapSubject.next(value);
                            break;
                        case 1:
                            this.pointerMiddleTapSubject.next(value);
                            break;
                        case 2:
                            this.pointerRightTapSubject.next(value);
                            break;
                    }
                    this.pointerTapSubject.next(value);

                    break;
                case PointerEventTypes.POINTERDOUBLETAP:
                    switch (button) {
                        case 0:
                            this.pointerLeftDoubleTapSubject.next(value);
                            break;
                        case 1:
                            this.pointerMiddleDoubleTapSubject.next(value);
                            break;
                        case 2:
                            this.pointerRightDoubleTapSubject.next(value);
                            break;
                    }
                    this.pointerDoubleTapSubject.next(value);
                    break;
            }
        });
    }

    initializeEventListeners() {
        const resize = fromEvent<UIEvent>(window, 'resize');
        resize.subscribe(event => {
            this.resizeSubject.next(event);
        });
    }
}
