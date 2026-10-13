BEGIN;

DO $$
DECLARE
  test_admin_id UUID;
  test_mentor_id UUID;
  test_intern_id UUID;
BEGIN
  SELECT id
  INTO test_admin_id
  FROM shared_accounts
  WHERE role = 'admin'
  LIMIT 1;

  SELECT account.id
  INTO test_mentor_id
  FROM shared_accounts account
  WHERE account.role = 'mentor'
  LIMIT 1;

  SELECT account.id
  INTO test_intern_id
  FROM shared_accounts account
  LEFT JOIN mentor_intern_assignments assignment
    ON assignment.intern_id = account.id
  WHERE account.role = 'intern'
    AND assignment.id IS NULL
  LIMIT 1;

  IF test_admin_id IS NULL THEN
    RAISE EXCEPTION 'Test cant run: no admin accounts exist';
  END IF;

  IF test_mentor_id IS NULL THEN
    RAISE EXCEPTION 'Test cant run: no mentor accounts exist';
  END IF;

  IF test_intern_id IS NULL THEN
    RAISE EXCEPTION 'Test cant run: no unassigned interns exist';
  END IF;

  -- Valid assignment
  INSERT INTO mentor_intern_assignments (
    mentor_id,
    intern_id,
    assigned_by
  )
  VALUES (
    test_mentor_id,
    test_intern_id,
    test_admin_id
  );

  -- Duplicate assignment
  BEGIN
    INSERT INTO mentor_intern_assignments (
      mentor_id,
      intern_id,
      assigned_by
    )
    VALUES (
      test_mentor_id,
      test_intern_id,
      test_admin_id
    );

    RAISE EXCEPTION 'FAIL: duplicate intern assignment was accepted';

  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'PASS: duplicate intern assignment was rejected';
  END;

  -- Unregistered intern account
  BEGIN
    INSERT INTO mentor_intern_assignments (
      mentor_id,
      intern_id,
      assigned_by
    )
    VALUES (
      test_mentor_id,
      gen_random_uuid(),
      test_admin_id
    );

    RAISE EXCEPTION
      'FAIL: invalid account reference was accepted';

  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE LOG 'PASS: invalid account reference was rejected';
  END;

  -- Same account used as mentor and intern
  BEGIN
    INSERT INTO mentor_intern_assignments (
      mentor_id,
      intern_id,
      assigned_by
    )
    VALUES (
      test_mentor_id,
      test_mentor_id,
      test_admin_id
    );

    RAISE EXCEPTION 'FAIL: identical mentor and intern were accepted';

  EXCEPTION
    WHEN check_violation THEN
      RAISE LOG 'PASS: identical Mentor and Intern were rejected';
  END;
END
$$;

ROLLBACK;