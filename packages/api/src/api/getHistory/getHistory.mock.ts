import { GetHistoryRequestBody, GetHistoryReturnType } from '@raylac/shared';

const getHistoryMock = async (
  _arg: GetHistoryRequestBody
): Promise<GetHistoryReturnType> => {
  return [];
};

export default getHistoryMock;
