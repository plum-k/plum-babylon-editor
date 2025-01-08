let debugNum = 0

export default function throwNum(num: number) {
    if (debugNum === num) {
        debugNum = 0
        throw new Error("")
    }
    debugNum += 1
}