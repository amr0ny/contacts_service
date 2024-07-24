import { DataObj } from '../schemas';
import { sha256 } from './crypto';

const isVariableValid = (variable: any): boolean => {
    return typeof variable !== 'object' && !Array.isArray(variable);
};

const makeToken = (dataObj: DataObj, password: string): string => {

    const objPairs = Object.entries({
        ...dataObj,
        Password: password
    })
        .sort((a, b) => a[0].localeCompare(b[0]))
        .filter(pair => isVariableValid(pair[1]));
    const concatedVals = objPairs.map(item => item[1]).join('');
    const token = sha256(concatedVals);
    return token;
};
export const appendToken = (dataObj: DataObj, password: string) => {
    const token = makeToken(dataObj, password);
    return {
        ...dataObj,
        Token: token
    };
};

export const checkToken = (dataObj: DataObj, actualToken: string, password: string): boolean => {
    const obj = {
        ...dataObj,
        Token: {}
    }
    const expectedToken = makeToken(obj, password);
    return !(expectedToken == null || expectedToken !== actualToken);
}