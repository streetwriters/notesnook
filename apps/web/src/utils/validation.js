function isValidEmail(email) {
  return /^([a-zA-Z0-9_\-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z0-9]{1,30})(\]?)$/.test(
    email
  );
}

export { isValidEmail };
