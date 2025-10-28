'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('camera_health_metrics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      camera_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cameras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ping_ms: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      packet_loss_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      bandwidth_mbps: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      bitrate_kbps: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      frame_drop_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      quality_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      recording_time_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      space_used_gb: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      retention_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      motion_events_today: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      alerts_pending: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_reboot_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      last_health_check: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      uniqueKeys: {
        camera_health_metrics_unique_camera_id_timestamp: {
          fields: ['camera_id', 'last_health_check']
        }
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('camera_health_metrics', ['camera_id'], {
      name: 'idx_camera_health_metrics_camera_id',
      unique: false
    });
    await queryInterface.addIndex('camera_health_metrics', ['last_health_check'], {
      name: 'idx_camera_health_metrics_last_health_check',
      unique: false
    });
    await queryInterface.addIndex('camera_health_metrics', ['quality_score'], {
      name: 'idx_camera_health_metrics_quality_score',
      unique: false
    });
    await queryInterface.addIndex('camera_health_metrics', ['is_active'], {
      name: 'idx_camera_health_metrics_is_active',
      unique: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('camera_health_metrics');
  }
};
