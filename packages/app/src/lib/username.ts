export const MIN_USERNAME_LENGTH = 3;
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

export const isValidUsername = (username: string) => {
  return (
    username.length >= MIN_USERNAME_LENGTH && USERNAME_REGEX.test(username)
  );
};
