import {DateTime} from 'luxon';

const getTimeString = () => {
    const now = DateTime.now();
    return now.toFormat('yyyy-MM-dd-HH-mm-ss')
};

export default getTimeString;
