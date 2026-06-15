function swap(array: number[], index1: number, index2: number) {
  [array[index1], array[index2]] = [array[index2], array[index1]];
}

const heapify = (array: number[], startIndex: number, arrSize: number) => {
  let currentIndex = startIndex;

  while (true) {
    const leftIndex = 2 * currentIndex + 1;
    const rightIndex = 2 * currentIndex + 2;

    let largestIndex = currentIndex;

    const leftValue = array[leftIndex];
    const rightValue = array[rightIndex];

    if (leftIndex < arrSize && leftValue > array[largestIndex]) {
      largestIndex = leftIndex;
    }

    if (rightIndex < arrSize && rightValue > array[largestIndex]) {
      largestIndex = rightIndex;
    }

    if (largestIndex === currentIndex) {
      return;
    }

    swap(array, currentIndex, largestIndex);
    currentIndex = largestIndex;
  }
};

const heapSort = (array: number[]) => {
  for (let i = Math.floor(array.length / 2) - 1; i >= 0; i--) {
    heapify(array, i, array.length);
  }

  for (let i = array.length - 1; i > 0; i--) {
    swap(array, 0, i);
    heapify(array, 0, i);
  }
};

const array = [6, 4, 20, 5, 1, 1, 55, 4, 1, 19, 9, 55, 422];
heapSort(array);
console.log(array);
