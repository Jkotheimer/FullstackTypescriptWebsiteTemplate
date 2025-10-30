import Constants from '@constants/shared';
import { FieldDescribe } from '@database/describe';
import { RequestError } from '@database/models/errors';
import StringUtils from '@utils/string';
export default class Utils {
    /**
     * @description Ensure that a request payload is valid
     * @param payload Payload from request
     * @param allowedFields Field describes that are allowed for this request
     * @throws {RequestError} If any extra unexpected fields are present, or if any required fields are missing
     */
    public static validateFields(payload: Record<string, any>, allowedFields: Array<FieldDescribe>): void {
        const allowedFieldSet: Set<string> = new Set(allowedFields.map((field) => field.name));

        // Throw an error if there are any extra fields that are not expected
        const unexpectedFields: Array<string> = [];
        for (const providedField of Object.keys(payload)) {
            if (!allowedFieldSet.has(providedField)) {
                unexpectedFields.push(providedField);
            }
        }
        if (unexpectedFields.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.INVALID_FIELDS, [
                unexpectedFields.length > 1 ? 's' : '',
                unexpectedFields.join(', ')
            ]);
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, errorMessage);
        }

        // Throw an error if any required fields are missing
        const missingRequiredFields: Array<string> = [];
        for (const requiredField of allowedFields.filter((field) => !field.nillable)) {
            if (payload[requiredField.name] == null) {
                missingRequiredFields.push(requiredField.name);
            }
        }
        if (missingRequiredFields.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.REQUIRED_FIELDS_MISSING, [
                missingRequiredFields.length > 1 ? 's' : '',
                missingRequiredFields.join(', ')
            ]);
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, errorMessage);
        }
    }
}
