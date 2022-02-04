import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse"

export type File = {
    type: "file"
    code: string
    /** A user-friendly name (not necessarily a valid filename) */
    name: string
    /** The filename for internal usage */
    filename: string
    mime_type: string
    /** The size in kb */
    size: number
    /** The creation date as Unix epoch */
    creation_date: number
}

export type Directory = {
    type: "dir"
    code: string
    name: string
    children: MaterialItem[]
}

export type MaterialItem = File | Directory;

/** @internal */
export function parseMaterial(item: any): MaterialItem {
    switch (item.tipo) {
        case "FILE":
            return {
                type: "file",
                code: item.code,
                name: item.descrizione,
                filename: item.nomefile,
                mime_type: item.cont_type,
                size: item.size_kb,
                creation_date: parseDate(item.data_ins, "YYYY/MM/DD hh:mm:ss").getTime(),
            };
        case "DIR":
            return {
                type: "dir",
                code: item.code,
                name: item.descrizione,
                children: item.files.map(it => parseMaterial(it)),
            };
        default:
            throw new Error("Unknown file type " + item.tipo);
    }
}

/** Gets a download URL for either a File object or a file code */
export async function getDownloadURL(device: Device, file: File | number): Promise<string> {
    let code;
    if (typeof file == "object") {
        code = (file as File).code;
    } else {
        code = file;
    }
    const data = await device.post("download.php", { code })
    checkError(data);
    return data.data.directurl;
}
