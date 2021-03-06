import { PropertyChangedEvent } from './propertyChangedEvent';
import { Tools } from 'babylonjs/Misc/tools';

export class ReplayRecorder {
    private _recordedCodeLines: string[];
    private _previousObject: any;
    private _previousProperty: string;

    public reset() {
        this._recordedCodeLines = [];
        this._previousObject = null;
        this._previousProperty = "";
    }

    private _getIndirectData(data: any) {
        if (!data.getClassName) {
            return data;
        }

        let indirectData = data.getClassName().toLowerCase();

        if (data.id) {
            if (indirectData === "Scene") {
                indirectData = `scene`;
            } else if (indirectData.indexOf("camera") > -1) {
                indirectData = `scene.getCameraByID("${data.id}")`;
            } else if (indirectData.indexOf("mesh") > -1) {
                indirectData = `scene.getMeshByID("${data.id}")`;
            } else if (indirectData.indexOf("light") > -1) {
                indirectData = `scene.getLightByID("${data.id}")`;
            } else if (indirectData === "transformnode") {
                indirectData = `scene.getTransformNodeByID("${data.id}")`;
            } else if (indirectData === "skeleton") {
                indirectData = `scene.getSkeletonById("${data.id}")`;
            } else if (indirectData.indexOf("material") > -1) {
                indirectData = `scene.getMaterialByID("${data.id}")`;
            }
        } else {
            indirectData = "new BABYLON." + data.getClassName() + "()";
        }

        return indirectData;
    }

    public record(event: PropertyChangedEvent) {
        if (!this._recordedCodeLines) {
            this._recordedCodeLines = [];
        }

        if (this._previousObject === event.object && this._previousProperty === event.property) {
            this._recordedCodeLines.pop();
        }

        let value = event.value;

        if (value.w !== undefined) { // Quaternion
            value = `new BABYLON.Quaternion(${value.x}, ${value.y}, ${value.z}, ${value.w})`;
        } else if (value.z !== undefined) { // Vector3
            value = `new BABYLON.Vector3(${value.x}, ${value.y}, ${value.z})`;
        } else if (value.y !== undefined) { // Vector2
            value = `new BABYLON.Vector2(${value.x}, ${value.y})`;
        } else if (value.a !== undefined) { // Color4
            value = `new BABYLON.Color4(${value.r}, ${value.g}, ${value.b}, ${value.a})`;
        } else if (value.b !== undefined) { // Color3
            value = `new BABYLON.Color3(${value.r}, ${value.g}, ${value.b})`;
        } else if (value.getClassName) {
            value = this._getIndirectData(value);
        }

        let target = this._getIndirectData(event.object);

        this._recordedCodeLines.push(`${target}.${event.property} = ${value};`);

        this._previousObject = event.object;
        this._previousProperty = event.property;
    }

    public export() {
        let content = "// Code generated by babylon.js Inspector\r\n// Please keep in mind to define the 'scene' variable before using that code\r\n\r\n";

        if (this._recordedCodeLines) {
            content += this._recordedCodeLines.join("\r\n");
        }

        Tools.Download(new Blob([content]), "pseudo-code.txt");
    }
}