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
    nextFrontPosition(position) {
        return (position + 1) % this.capacity;
    }
    nextBackPosition(position) {
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
        const nextPosition = this.nextFrontPosition(this.endIndex);
        this.endIndex = nextPosition;
        this.count++;
        return true;
    }
    pop() {
        if (this.isEmpty) {
            return undefined;
        }
        this.endIndex = this.nextBackPosition(this.endIndex);
        const value = this.data[this.endIndex];
        this.data[this.endIndex] = undefined;
        this.count--;
        return value;
    }
    unshift(value) {
        if (this.isFull) {
            return false;
        }
        const nextPosition = this.nextBackPosition(this.startIndex);
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
        this.startIndex = this.nextFrontPosition(this.startIndex);
        this.count--;
        return value;
    }
    toString() {
        return this.data
            .map((item, index) => {
            if (index === this.endIndex && index === this.startIndex) {
                return `<se>${item}</se>`;
            }
            if (index === this.startIndex) {
                return `<s>${item}</s>`;
            }
            if (index === this.endIndex) {
                return `<e>${item}</e>`;
            }
            return `${item}`;
        })
            .toString();
    }
}
