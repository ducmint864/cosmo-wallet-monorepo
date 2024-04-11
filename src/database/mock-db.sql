create table base_account (
	base_acc_id SERIAL primary key,

	email varchar not null unique, --validate email in nodejs b4 inserting to db
	username varchar not null unique, --server generates random, unique name if not specified
	password varchar not null, --hashed with bcrypt
	mnemonic bytea not null unique,
	pbkdf2_salt bytea not null,
	iv bytea not null 
);

create table derived_account (
	derived_acc_id SERIAL primary key,

	nickname varchar default 'anonymous',
<<<<<<< HEAD
	privkey bytea not null unique, --encrypted private key
	privkey_iv bytea not null,
=======
>>>>>>> parent of 1a755af ([Refactor]:)
	address varchar not null unique, --bech32 address
	hd_path varchar not null,

	base_acc_id integer not null,
	foreign key (base_acc_id) references base_account(base_acc_id)
);

<<<<<<< HEAD
//create table standalone_account (
	//standalone_acc_id SERIAL primary key,
//
	//nickname varchar default 'anonymous',
	//address varchar not null unique, --bech32 address
	//private_key varchar not null unique  --base64 private key
//);

=======
>>>>>>> parent of 1a755af ([Refactor]:)
create table balances (
	denom varchar not null,
	amount integer default 0,
	primary key (derived_acc_id, denom),

	derived_acc_id integer not null,
	foreign key (derived_acc_id) references derived_account(derived_acc_id)
);

create type tx_status_enum as enum ('pending', 'succeed', 'failed');
create type tx_type_enum as enum ('token_transfer', 'nft_transfer', 'others');

create table transaction (
	txid SERIAL primary key,
	txhash varchar not null unique,
	timestamp timestamp not null, --timestamp without timezone
	sender_address varchar not null, --bech32 address
	receiver_address varchar, --bech32 address
	status tx_status_enum default 'pending',
	type tx_type_enum default 'token_transfer',
	gas_limit integer,
	gas_used integer,
	gas_price integer,

	derived_acc_id integer not null,
	foreign key (derived_acc_id) references derived_account(derived_acc_id)
);

create table fee (
	denom varchar not null,
	amount integer default 0,
	primary key (txid, denom),
	
	txid integer not null,
	foreign key (txid) references transaction(txid)
);

-- STORED PROCEDURES:

-- FUNCTIONS
CREATE OR REPLACE FUNCTION get_largest_derived_acc_id(base_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    max_derived_acc_id INTEGER;
BEGIN
    SELECT MAX(derived_acc_id) INTO max_derived_acc_id
    FROM derived_account
    WHERE base_acc_id = base_id_param;

    RETURN max_derived_acc_id;
END;
$$ LANGUAGE plpgsql;


-- CONSTRAINTS

-- TRIGGERS


-- Encryption specs:
-- Bcrypt : { Cost factor: 10 | Tool: https://bcrypt.online/ }
-- PBKDF2 : { Mode: PBKDF2WithHmacSHA512 | Iterations: 1000 | Base salt: wfci2plBNrUJxZLpdL5vtw== | dkLen: 96 | Format: Base64 | Tool: https://8gwifi.org/pbkdf.jsp }
-- AES: { Mode: ECB | Encryption key length: 128 bits | Format: Base64 | Tool: https://www.javainuse.com/aesgenerator }

-- Insert mock data into base_account table
INSERT INTO base_account (email, username, password, mnemonic) VALUES
('user1@example.com', 'user1', '$2y$10$4Cki7sltFHYSdZnGDfiBouu9SdQwBx0WGfBgNUQyAXxNp3CRsSBV.', '5Yse/kF72uR/9e3FQ1qLNawnnpRViZORMCdJ9r6C3Bytfv/NpdB4jhlUP/jBtguBhBVwNhYKbo1ObaSOt79wjaYBjhDmezRErNMaHkBVNIs='), -- og password: password1 | og mnemonic: palm glance recall deposit scan stove muscle valid promote when pelican vacant
('user2@example.com', 'user2', '$2y$10$HRBpLKb6oeY3jQSVmCNTC.FgArEJWKBGtH3TyP8G4yOmINtPtTrMK', 'RklF/970Id9eO5kQOz5QOOUBKdOQ+aQ6Wy4O8x4pblQ+VfsA19sUG+4kFBLCkj4OxVNfas2Zub3NwjXeUK2e50i7RnCtJprr5wy/FVFKYZY='), --og password: password2 | og mnemonic: soccer flock huge fiber oak decline vocal parade proof play wheat harbor
('user3@example.com', 'user3', '$2y$10$A1z8o9LW0jJp5iGxULfUl.DD4K8g49cYI/PvlKFTNwm6jrewEObiq', '3uF/SEyID09vXt/jppSXnMS0753a8h+zzs9/Cwd6FV4psjw8DsxB5Watwc7zEtcHqRK3ucRfVT7rAxpbfcRS9M7jLYNyrJy2OB02jr9Sdm8='); --og password: password3 | og mnemonic: scout wisdom meadow early knee auction kit any exclude tomato perfect stem

-- Insert mock data into derived_account table
INSERT INTO derived_account (nickname, address, hd_path, base_acc_id) VALUES
('crypto ant', 'thasa1szyqfh29x70cltugd92q7ssk93gn6zet60cuuw', 'm/44''/0/0''/0/0', 1),
('crypto spider', 'thasa1h4th0p9p9zql28w3l2vx0p0wfr2wt3u2eyaclc', 'm/44''/0/0''/0/0', 2),
('crypto bear', 'thasa1euulrh9pmejkdwvryqyqr3786gjet3ncculq2q', 'm/44''/0/0''/0/0', 3);

-- Insert mock data into balances table
INSERT INTO balances (denom, amount, derived_acc_id) VALUES
('THAS', 100, 1),
('THAS', 200, 2),
('THAS', 50, 3);

-- Insert mock data into transaction table
INSERT INTO transaction (txhash, timestamp, sender_address, receiver_address, status, type, gas_limit, gas_used, gas_price, derived_acc_id) VALUES
('fake_transaction_hash1', '2024-03-20 12:00:00', 'thasa1szyqfh29x70cltugd92q7ssk93gn6zet60cuuw', 'thasa1h4th0p9p9zql28w3l2vx0p0wfr2wt3u2eyaclc', 'succeed', 'token_transfer', 1000, 500, 1, 1);

-- Insert mock data into fee table
INSERT INTO fee (denom, amount, txid) VALUES
('THAS', 10, 1);
