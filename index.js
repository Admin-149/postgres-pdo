class Pdo {
    constructor(client, options = {}) {
        this.client = client;
        this.escape = options.escapeCb || escape;
        this.unescape = options.unescapeCb || unescape;

        this.clean();
    }

    clean() {
        this._type = null;
        this._table = null;
        this._where = null;
        this._columns = null;
        this._values = null;
        this._groupBy = null;
        this._select = null;
    }

    select(select = ['*']) {
        this.clean();
        this._type = 'select'
        this._select = select;
        return this;
    }

    from(table) {
        this._table = table;
        return this;
    }

    update(pairs = null) {
        this.clean();
        this._type = 'update';
        if (pairs) {
            this.set(pairs);
        }
        return this;
    }

    set(pairs) {
        this._columns = [];
        this._values = [];
        Object.keys(pairs).forEach(key => {
            this._columns.push(key);
            this._values.push(pairs[key]);
        });
        return this;
    }

    table(table) {
        this._table = table;
        return this;
    }

    insert(columns = null) {
        this.clean();
        this._type = 'insert';
        this.columns(columns);
        return this;
    }

    columns(columns) {
        this._columns = columns;
        return this;
    }

    values(values) {
        this._values = values;
        return this;
    }

    into(table) {
        this._table = table;
        return this;
    }

    delete(table) {
        this.clean();
        this._type = 'delete';
        this._table = table;
        return this;
    }

    where(clause, cond, value) {
        this._where = `${clause} ${cond} ${this.escapeData(value)}`;
        return this;
    }

    andWhere(clause, cond, value) {
        this._where = `${this._where} AND ${clause} ${cond} ${this.escapeData(value)}`;
        return this;
    }

    orWhere(clause, cond, value) {
        this._where = `${this._where} OR ${clause} ${cond} ${this.escapeData(value)}`;
        return this;
    }

    whereIn(clause, arr) {
        this._where = `${clause} IN (${arr.map(this.escapeData).join(',')})`;
        return this;
    }

    groupBy(groupBy) {
        this._groupBy = groupBy;
        return this;
    }

    escapeData(value) {
        if (value.toString().replace(/(\d|\.)/g, '').length === 0) {
            return parseFloat(value);
        } else {
            return `'${this.escape(value)}'`;
        }
    }

    execute() {
        let query;
        switch (this._type) {
            case 'select':
                query = `SELECT ${this._select?.join(',')} FROM ${this._table}`;
                if (this._where) {
                    query += ` WHERE ${this._where}`;
                }
                if (this._groupBy) {
                    query += ` GROUP BY ${this._groupBy}`;
                }
                return this.client.unsafe(query);
            case 'insert':
                query =
                    `INSERT INTO ${this._table} (${this._columns?.join(',')}) VALUES (${this._values?.map(this.escapeData).join(',')})`;
                return this.client.unsafe(query);
            case 'update':
                query = `UPDATE ${this._table} SET ${this._values?.map((value, i) => {
                    return `${this._columns[i]} = ${this.escapeData(value)}`;
                }).join(',')}`;
                if (this._where) {
                    query += ` WHERE ${this._where}`;
                }
                return this.client.unsafe(query);
            case 'delete':
                query = `DELETE FROM ${this._table}`;
                if (this._where) {
                    query += ` WHERE ${this._where}`;
                }
                return this.client.unsafe(query);
        }
    }
}

module.exports = Pdo;
