"use strict";
class LoopedArray {
    capacity;
    startIndex = 0;
    endIndex = 0;
    count = 0;
    data;
    constructor(init) {
        if (typeof init === 'number') {
            this.capacity = init;
            this.data = new Array(init).fill(undefined);
            return;
        }
        const length = init.length;
        this.capacity = length;
        this.data = init;
    }
    stepForward(position) {
        return (position + 1) % this.capacity;
    }
    stepBackward(position) {
        return (position - 1 + this.capacity) % this.capacity;
    }
    get isFull() {
        return this.count === this.capacity;
    }
    get isEmpty() {
        return this.count === 0;
    }
    push(value) {
        if (this.isFull) {
            return false;
        }
        this.data[this.endIndex] = value;
        const nextPosition = this.stepForward(this.endIndex);
        this.endIndex = nextPosition;
        this.count++;
        return true;
    }
    pop() {
        if (this.isEmpty) {
            return undefined;
        }
        this.endIndex = this.stepBackward(this.endIndex);
        const value = this.data[this.endIndex];
        this.data[this.endIndex] = undefined;
        this.count--;
        return value;
    }
    unshift(value) {
        if (this.isFull) {
            return false;
        }
        const nextPosition = this.stepBackward(this.startIndex);
        this.data[nextPosition] = value;
        this.startIndex = nextPosition;
        this.count++;
        return true;
    }
    shift() {
        if (this.isEmpty) {
            return undefined;
        }
        const value = this.data[this.startIndex];
        this.data[this.startIndex] = undefined;
        this.startIndex = this.stepForward(this.startIndex);
        this.count--;
        return value;
    }
    toString() {
        return this.data.toString();
    }
    get state() {
        return {
            capacity: this.capacity,
            startIndex: this.startIndex,
            endIndex: this.endIndex,
            count: this.count,
            isFull: this.isFull,
            isEmpty: this.isEmpty,
            data: this.data.slice(),
        };
    }
}
