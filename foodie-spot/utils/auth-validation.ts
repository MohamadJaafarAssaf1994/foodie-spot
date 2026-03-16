export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues extends LoginFormValues {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface RegisterFieldErrors {
  firstName?: ValidationErrorKey;
  lastName?: ValidationErrorKey;
  email?: ValidationErrorKey;
  password?: ValidationErrorKey;
  confirmPassword?: ValidationErrorKey;
}

export type ValidationErrorKey =
  | 'validation_email_required'
  | 'validation_email_invalid'
  | 'validation_password_required'
  | 'validation_first_name_required'
  | 'validation_last_name_required'
  | 'validation_password_too_short'
  | 'validation_password_mismatch';

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const MIN_PASSWORD_LENGTH = 8;

const normalize = (value: string) => value.trim();

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(normalize(email));

export const validateLoginForm = ({ email, password }: LoginFormValues): ValidationErrorKey | null => {
  if (!normalize(email)) {
    return 'validation_email_required';
  }

  if (!isValidEmail(email)) {
    return 'validation_email_invalid';
  }

  if (!password) {
    return 'validation_password_required';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'validation_password_too_short';
  }

  return null;
};

export const validateRegisterForm = ({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
}: RegisterFormValues): ValidationErrorKey | null => {
  const fieldErrors = validateRegisterFields({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
  });

  return (
    fieldErrors.firstName ||
    fieldErrors.lastName ||
    fieldErrors.email ||
    fieldErrors.password ||
    fieldErrors.confirmPassword ||
    null
  );
};

export const validateRegisterFields = ({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
}: RegisterFormValues): RegisterFieldErrors => {
  const fieldErrors: RegisterFieldErrors = {};

  if (!normalize(firstName)) {
    fieldErrors.firstName = 'validation_first_name_required';
  }

  if (!normalize(lastName)) {
    fieldErrors.lastName = 'validation_last_name_required';
  }

  if (!normalize(email)) {
    fieldErrors.email = 'validation_email_required';
  } else if (!isValidEmail(email)) {
    fieldErrors.email = 'validation_email_invalid';
  }

  if (!password) {
    fieldErrors.password = 'validation_password_required';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = 'validation_password_too_short';
  }

  if (!confirmPassword || password !== confirmPassword) {
    fieldErrors.confirmPassword = 'validation_password_mismatch';
  }

  return fieldErrors;
};
