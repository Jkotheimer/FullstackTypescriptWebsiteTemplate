export default class StringUtils {
    public static format(formatString: string, variables: string[]): string {
        return formatString.replace(/{(\d+)}/g, function (match, index) {
            if (typeof index !== 'number') {
                index = parseInt(index);
            }
            return typeof variables[index] != 'undefined' ? variables[index] : match;
        });
    }

    public static escapeSingleQuotes(str: string): string {
        return str.replace(/'/g, "\\'");
    }
}
