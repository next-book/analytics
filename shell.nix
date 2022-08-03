{ pkgs ? import <nixpkgs> {} }:

let 
in pkgs.mkShell {
  packages = with pkgs; [
    nodejs-16_x
    nodePackages.npm
    postgresql_14 
  ];

# env variables used by posgresql and its cli (psql)
PGDATA = "${toString ./.}/.pg";
PGUSER = "postgres";
PGDATABASE = "analytics";

# custom postgres config
postgresConf =
  pkgs.writeText "postgresql.conf"
    ''
      # Add Custom Settings
      log_min_messages = warning
      log_min_error_statement = error
      log_min_duration_statement = 100  # ms
      log_connections = on
      log_disconnections = on
      log_duration = on
      log_timezone = 'UTC'
      log_statement = 'all'
      log_directory = 'pg_log'
      log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
      logging_collector = on
      log_min_error_statement = error
      unix_socket_directories = '$PGDATA'
    '';

  # run the postgresql 
  shellHook = ''
    echo "Using postgresql."

    # Setup: other env variables
    export PGHOST="$PGDATA"
    # Setup: DB
    [ ! -d $PGDATA ] && pg_ctl initdb -o "-U $PGUSER" && cat "$postgresConf" >> $PGDATA/postgresql.conf

    pg_ctl -o "-k $PGDATA" start
    createdb $PGDATABASE

    function end {
      echo "Shutting down the database..."
      pg_ctl stop
      echo "Removing directories..."
      rm -rf $PGDATA 
    }
    trap end EXIT
    alias pg="psql -U $PGUSER"
  '';
}
