--
-- PostgreSQL database dump
--

-- Dumped from database version 14.4
-- Dumped by pg_dump version 14.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dev; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA dev;


ALTER SCHEMA dev OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: event; Type: TABLE; Schema: dev; Owner: postgres
--

CREATE TABLE dev.event (
    id bigint NOT NULL,
    "time" timestamp with time zone DEFAULT now() NOT NULL,
    type character varying(255) NOT NULL,
    session_id character varying(255),
    book_id character varying(255) NOT NULL,
    domain character varying(255) NOT NULL,
    url character varying(255) NOT NULL,
    pathname character varying(255),
    book_location character varying(255),
    referrer character varying(255),
    category character varying(255),
    action character varying(255),
    utm_medium character varying(255),
    utm_source character varying(255),
    utm_campaign character varying(255),
    utm_content character varying(255),
    utm_term character varying(255),
    label character varying(255),
    value character varying(255),
    operating_system character varying(255),
    operating_system_version character varying(255),
    browser character varying(255),
    browser_version character varying(255),
    screen_size character varying(255),
    client_id character varying(255),
    user_id character varying(255)
);


ALTER TABLE dev.event OWNER TO postgres;

--
-- Name: event_id_seq; Type: SEQUENCE; Schema: dev; Owner: postgres
--

CREATE SEQUENCE dev.event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dev.event_id_seq OWNER TO postgres;

--
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: postgres
--

ALTER SEQUENCE dev.event_id_seq OWNED BY dev.event.id;


--
-- Name: event id; Type: DEFAULT; Schema: dev; Owner: postgres
--

ALTER TABLE ONLY dev.event ALTER COLUMN id SET DEFAULT nextval('dev.event_id_seq'::regclass);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: dev; Owner: postgres
--

ALTER TABLE ONLY dev.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

